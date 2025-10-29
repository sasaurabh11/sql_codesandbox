import mongoose from "mongoose";

const ColumnSchema = new mongoose.Schema(
  {
    columnName: String,
    dataType: String,
  },
  { _id: false }
);

const TableSchema = new mongoose.Schema(
  {
    tableName: String,
    columns: [ColumnSchema],
    rows: [Array], // each row = array of values
  },
  { _id: false }
);

const WorkspaceSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true, unique: true },
  name: String,
  userId: { type: String, default: null },
  tables: [TableSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

WorkspaceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Workspace = mongoose.model("Workspace", WorkspaceSchema);
export default Workspace;
