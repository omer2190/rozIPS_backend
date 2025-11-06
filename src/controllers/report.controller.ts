import { Request, Response } from "express";
import Lead from "../models/Lead";
import mongoose from "mongoose";

// @route   GET api/reports/marketers
// @desc    Get marketer performance report
// @access  Private (Manager)
export const getMarketerPerformance = async (req: Request, res: Response) => {
  try {
    // Leads created by each marketer
    const marketerPerformance = await Lead.aggregate([
      {
        $group: {
          _id: "$createdBy",
          totalLeads: { $sum: 1 },
          statuses: { $push: "$status" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "marketer",
        },
      },
      {
        $unwind: "$marketer",
      },
      {
        $project: {
          _id: 0,
          marketerId: "$_id",
          marketerName: "$marketer.name",
          totalLeads: "$totalLeads",
          installedCount: {
            $size: {
              $filter: {
                input: "$statuses",
                as: "status",
                cond: { $eq: ["$$status", "installed"] },
              },
            },
          },
        },
      },
    ]);

    // Completion rate for each installer
    const installerPerformance = await Lead.aggregate([
      {
        $match: { assignedTo: { $ne: null } },
      },
      {
        $group: {
          _id: "$assignedTo",
          totalAssigned: { $sum: 1 },
          installedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "installed"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "installer",
        },
      },
      {
        $unwind: "$installer",
      },
      {
        $project: {
          _id: 0,
          installerId: "$_id",
          installerName: "$installer.name",
          totalAssigned: "$totalAssigned",
          installedCount: "$installedCount",
          completionRate: {
            $cond: [
              { $eq: ["$totalAssigned", 0] },
              0,
              { $divide: ["$installedCount", "$totalAssigned"] },
            ],
          },
        },
      },
    ]);

    // Most common rejection reasons
    const rejectionReasons = await Lead.aggregate([
      {
        $match: {
          status: { $in: ["rejected", "postponed"] },
          rejectionReason: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$rejectionReason",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          reason: "$_id",
          count: "$count",
        },
      },
    ]);

    res.json({
      marketerPerformance,
      installerPerformance,
      rejectionReasons,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// تقرير الموضفين يجب ان يصلح على شكل بياني
export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const employeePerformance = await Lead.aggregate([
      {
        $facet: {
          marketerPerformance: [
            {
              $group: {
                _id: "$createdBy",
                totalLeads: { $sum: 1 },
                newLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
                },
                assignedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
                },
                installedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "installed"] }, 1, 0] },
                },
                rejectedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "employee",
              },
            },
            {
              $unwind: "$employee",
            },
            {
              $project: {
                _id: 0,
                employeeId: "$_id",
                employeeName: "$employee.name",
                role: "$employee.role",
                totalLeads: "$totalLeads",
                newLeads: "$newLeads",
                assignedLeads: "$assignedLeads",
                installedLeads: "$installedLeads",
                rejectedLeads: "$rejectedLeads",
              },
            },
            {
              $match: { role: "marketer" },
            },
          ],
          installerPerformance: [
            {
              $group: {
                _id: "$assignedTo",
                totalAssignedLeads: { $sum: 1 },
                installedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "installed"] }, 1, 0] },
                },
                rejectedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                },
                postponedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "postponed"] }, 1, 0] },
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "employee",
              },
            },
            {
              $unwind: "$employee",
            },
            {
              $project: {
                _id: 0,
                employeeId: "$_id",
                employeeName: "$employee.name",
                role: "$employee.role",
                totalAssignedLeads: "$totalAssignedLeads",
                installedLeads: "$installedLeads",
                rejectedLeads: "$rejectedLeads",
                postponedLeads: "$postponedLeads",
              },
            },
            {
              $match: { role: "installer" },
            },
          ],
        },
      },
    ]);

    res.json(employeePerformance);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};
