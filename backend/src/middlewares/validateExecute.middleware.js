export function validateExecuteRequest(req, res, next) {
  const { workspaceId, sql } = req.body;

  if (!workspaceId || typeof workspaceId !== "string") {
    return res
      .status(400)
      .json({
        ok: false,
        error: "workspaceId is required and must be a string",
      });
  }

  if (!sql || typeof sql !== "string" || sql.trim() === "") {
    return res
      .status(400)
      .json({
        ok: false,
        error: "SQL query is required and must be a non-empty string",
      });
  }

  next();
}
