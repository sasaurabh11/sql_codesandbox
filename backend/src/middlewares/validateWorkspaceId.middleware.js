export default function validateWorkspaceId(req, res, next) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res
      .status(400)
      .json({ ok: false, error: "workspaceId is required" });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(workspaceId)) {
    return res
      .status(400)
      .json({ ok: false, error: "Invalid workspaceId format" });
  }

  req.workspaceId = workspaceId;
  req.schemaName = `workspace_${workspaceId}`;
  next();
}
