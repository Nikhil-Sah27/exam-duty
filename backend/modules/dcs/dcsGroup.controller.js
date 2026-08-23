const dcsGroupService = require("./dcsGroup.service");
const catchAsync = require("../../shared/utils/catchAsync");

const listGroups = catchAsync(async (req, res) => {
  const groups = await dcsGroupService.listGroups(req.query);
  res.status(200).json({ success: true, count: groups.length, data: groups });
});

const getMine = catchAsync(async (req, res) => {
  const groups = await dcsGroupService.getMyGroups(req.user.id);
  res.status(200).json({ success: true, count: groups.length, data: groups });
});

const getById = catchAsync(async (req, res) => {
  const group = await dcsGroupService.getGroupById(req.params.id);
  res.status(200).json({ success: true, data: group });
});

const claim = catchAsync(async (req, res) => {
  const result = await dcsGroupService.claimGroup(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    data: result.group,
    duties: result.dutyIds,
  });
});

const adminClaim = catchAsync(async (req, res) => {
  const result = await dcsGroupService.adminClaimGroup(
    req.params.id,
    req.body?.teacher,
    req.user.id,
  );
  res.status(200).json({
    success: true,
    data: result.group,
    duties: result.dutyIds,
  });
});

const release = catchAsync(async (req, res) => {
  const group = await dcsGroupService.releaseGroup(
    req.params.id,
    req.user.id,
    req.body?.reason
  );
  res.status(200).json({ success: true, data: group });
});

const getRoomInvigilators = catchAsync(async (req, res) => {
  const data = await dcsGroupService.getRoomInvigilators(req.params.id);
  res.status(200).json({ success: true, data });
});

module.exports = {
  listGroups,
  getMine,
  getById,
  claim,
  adminClaim,
  release,
  getRoomInvigilators,
};
