import e, { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import Lead from "../models/Lead";
import User from "../models/User";

// @route   POST api/leads
// @desc    Create a new lead
// @access  Private (Marketer)
export const createLead = async (req: AuthRequest, res: Response) => {
  const { customerName, motherName, phone, addressText, location, notes } =
    req.body;

  try {
    const existingLead = await Lead.findOne({ phone });
    if (existingLead) {
      return res.status(400).json({ message: "هذا الرقم موجود بالفعل." });
    }
    const homePhotoURL = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (homePhotoURL == undefined) {
      console.log("Home photo is required.: ", homePhotoURL);
      return res.status(400).json({ message: "صورة المنزل مطلوبة." });
    }

    const newLead = new Lead({
      customerName,
      motherName,
      phone,
      addressText,
      location,
      homePhotoURL,
      notes,
      createdBy: req.user!.id,
      status: "new",
      statusHistory: [{ status: "new", changedBy: req.user!.id }],
    });

    const lead = await newLead.save();
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

    const lead = await Lead.findById(req.params.id);
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

    // TODO: Implement push notification simulation/service
    console.log(`Lead ${lead.id} assigned to installer.`);

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
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "العميل غير موجود." });
    }

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
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ msg: "Lead not found." });
    }

    if (lead.assignedTo?.toString() !== req.user!.id) {
      return res
        .status(403)
        .json({ msg: "User not authorized to update this lead." });
    }

    lead.status = status;
    lead.statusHistory.push({
      status,
      changedBy: req.user!.id,
      timestamp: new Date(),
    });

    if (status === "installed") {
      lead.installationDetails = {
        ...installationDetails,
        installDate: new Date(),
      };
    } else if (status === "rejected" || status === "postponed") {
      lead.rejectionReason = rejectionReason;
    }

    await lead.save();
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
