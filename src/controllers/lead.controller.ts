import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import Lead from "../models/Lead";
import User from "../models/User";
import NotificationService from "../services/notification.service";

// @route   POST api/leads
// @desc    Create a new lead
// @access  Private (Marketer)
export const createLead = async (req: AuthRequest, res: Response) => {
  const {
    customerName,
    motherName,
    phone,
    addressText,
    location,
    notes,
    type,
  } = req.body;

  try {
    const existingLead = await Lead.findOne({ phone });
    if (existingLead) {
      return res.status(400).json({ message: "هذا الرقم موجود بالفعل." });
    }
    const homePhotoURL = req.file ? `/uploads/${req.file.filename}` : "hhhh";

    let parsedLocation: any;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location ?? "latitude:0,longitude:0");
      } catch (e) {
        return res
          .status(400)
          .json({ message: "صيغة الموقع المرسلة غير صحيحة (ليست JSON)." });
      }
    } else {
      parsedLocation = location;
    }
    const finalLocation = {
      latitude: Number(parsedLocation?.latitude),
      longitude: Number(parsedLocation?.longitude),
    };
    if (
      !finalLocation ||
      isNaN(finalLocation.latitude) ||
      isNaN(finalLocation.longitude)
    ) {
      return res.status(400).json({
        message:
          "حقل 'location' مطلوب ويجب أن يتضمن إحداثيات (latitude و longitude) رقمية صحيحة.",
      });
    }

    const newLead = new Lead({
      customerName,
      motherName,
      phone,
      addressText,
      location: finalLocation,
      homePhotoURL,
      notes,
      createdBy: req.user!.id,
      status: "new",
      type: type || "جديد",
      statusHistory: [{ status: "new", changedBy: req.user!.id }],
    });

    const lead = await newLead.save();

    // Notify all managers and installers about the new lead
    await NotificationService.sendToRoles(
      ["manager", "installer"],
      {
        title: "عميل جديد",
        body: `تمت إضافة عميل جديد "${lead.customerName}" بواسطة المسوق ${req.user?.name}.`,
        leadId: lead.id,
      },
      [req.user!.id]
    ); // Exclude the creator

    res.json(lead);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   GET api/leads/mine
// @desc    Get all leads created by the current marketer
// @access  Private (Marketer)
export const getMyLeads = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const leads = await Lead.find()
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("statusHistory.changedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(leads);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   GET api/leads/all
// @desc    Get all leads with filtering
// @access  Private (Manager)
export const getAllLeads = async (req: AuthRequest, res: Response) => {
  const { status, marketerId, installerId, searchKeyword } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (status) filter.status = status;
  // if (marketerId) filter.createdBy = marketerId;
  if (installerId) filter.assignedTo = installerId;
  if (marketerId) filter.createdBy = marketerId;
  if (searchKeyword) {
    filter.$or = [
      { customerName: { $regex: searchKeyword, $options: "i" } },
      { motherName: { $regex: searchKeyword, $options: "i" } },
      { phone: { $regex: searchKeyword, $options: "i" } },
    ];
  }

  try {
    const leads = await Lead.find(filter)
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("statusHistory.changedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(leads);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

export const assignLead = async (req: AuthRequest, res: Response) => {
  const installerId = req.user?.id;

  try {
    const installer = await User.findById(installerId);
    if (!installer) {
      return res
        .status(400)
        .json({ message: "مركب غير صالح.", installer: installer });
    }

    const lead = await Lead.findById(req.params.id).populate("createdBy");
    if (!lead) {
      return res.status(404).json({ message: "العميل غير موجود." });
    }

    lead.assignedTo = installerId;
    lead.status = "assigned";
    lead.statusHistory.push({
      status: "assigned",
      changedBy: req.user!.id,
      timestamp: new Date(),
    });

    await lead.save();

    // Notify managers and the original marketer
    await NotificationService.sendToRoles(["manager"], {
      title: "تم قبول طلب",
      body: `قبل المنصّب ${installer.name} طلب العميل ${lead.customerName}.`,
      leadId: lead.id,
    });

    if (lead.createdBy) {
      await NotificationService.sendToUser(
        (lead.createdBy as any)._id.toString(),
        {
          title: "تم قبول طلبك",
          body: `قبل المنصّب ${installer.name} طلب العميل ${lead.customerName} الذي أضفته.`,
          leadId: lead.id,
        }
      );
    }

    res.json(lead);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   PUT api/leads/:id/status
// @desc    Manually update lead status
// @access  Private (Manager)
export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
  const { status, rejectionReason } = req.body;

  try {
    const lead = await Lead.findById(req.params.id)
      .populate("createdBy")
      .populate("assignedTo");
    if (!lead) {
      return res.status(404).json({ message: "العميل غير موجود." });
    }

    const oldStatus = lead.status;
    lead.status = status;
    lead.statusHistory.push({
      status,
      changedBy: req.user!.id,
      timestamp: new Date(),
    });
    if (status === "rejected" || status === "postponed") {
      lead.rejectionReason = rejectionReason;
    }

    await lead.save();

    // Notify marketer and installer about the status change by manager
    const notificationPayload = {
      title: `تحديث حالة الطلب`,
      body: `قام المدير ${req.user?.name} بتغيير حالة طلب العميل ${lead.customerName} من "${oldStatus}" إلى "${status}".`,
      leadId: lead.id,
    };

    if (lead.createdBy) {
      await NotificationService.sendToUser(
        (lead.createdBy as any)._id.toString(),
        notificationPayload
      );
    }
    if (lead.assignedTo) {
      await NotificationService.sendToUser(
        (lead.assignedTo as any)._id.toString(),
        notificationPayload
      );
    }

    res.json(lead);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   GET api/leads/tasks
// @desc    Get tasks assigned to the current installer
// @access  Private (Installer)
export const getInstallerTasks = async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({
      // assignedTo: req.user!.id,
      status: "new",
    })
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("statusHistory.changedBy", "name")
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   PUT api/leads/:id/install
// @desc    Submit installation details
// @access  Private (Installer)
export const submitInstallation = async (req: AuthRequest, res: Response) => {
  const { status, installationDetails, rejectionReason } = req.body;

  try {
    const lead = await Lead.findById(req.params.id).populate("createdBy");

    if (!lead) {
      return res.status(404).json({ msg: "Lead not found." });
    }

    if (lead.assignedTo?.toString() !== req.user!.id) {
      return res
        .status(403)
        .json({ msg: "User not authorized to update this lead." });
    }

    const oldStatus = lead.status;
    lead.status = status;
    lead.statusHistory.push({
      status,
      changedBy: req.user!.id,
      timestamp: new Date(),
    });

    if (status === "installed") {
      console.log("Installation details: ", installationDetails);
      lead.installationDetails = {
        ...installationDetails,
        username: `Kan-${installationDetails?.cabinet}-${installationDetails?.poleNumber}-${installationDetails?.port}@Roz`,
        password: "100",
        installDate: new Date(),
      };
    } else if (status === "rejected" || status === "postponed") {
      lead.rejectionReason = rejectionReason;
    }

    await lead.save();

    // Notify managers and the original marketer
    const notificationPayload = {
      title: `تحديث من المنصّب`,
      body: `قام المنصّب ${req.user?.name} بتحديث حالة طلب العميل ${lead.customerName} إلى "${status}".`,
      leadId: lead.id,
    };

    await NotificationService.sendToRoles(["manager"], notificationPayload);

    if (lead.createdBy) {
      await NotificationService.sendToUser(
        (lead.createdBy as any)._id.toString(),
        notificationPayload
      );
    }

    res.json(lead);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({
      assignedTo: req.user!.id,
      // status: "assigned",
    })
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("statusHistory.changedBy", "name")
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};
export const getLeadCounts = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  try {
    if (!user) {
      return res.status(401).json({ message: "غير مصرح" });
    }

    let filter: any = {};

    if (user.role === "manager") {
      // Managers can see counts for all leads, so no filter is applied.
    } else if (user.role === "marketer") {
      // Marketers can see counts for leads they created.
      filter.createdBy = user.id;
    } else if (user.role === "installer") {
      // Installers can see counts for leads assigned to them.
      filter.assignedTo = user.id;
    } else {
      return res.status(403).json({ message: "تم رفض الوصول." });
    }

    const totalLeads = await Lead.countDocuments(filter);
    const assignedLeads = await Lead.countDocuments({
      ...filter,
      status: "assigned",
    });
    const newLeads = await Lead.countDocuments({
      ...filter,
      status: "new",
    });
    const installedLeads = await Lead.countDocuments({
      ...filter,
      status: "installed",
    });
    const rejectedLeads = await Lead.countDocuments({
      ...filter,
      status: "rejected",
    });

    res.json({
      totalLeads,
      assignedLeads,
      installedLeads,
      rejectedLeads,
      newLeads,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};
