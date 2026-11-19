import { getAdminRecords, removeListing } from "./adminRepository.js";

export async function listRecords(req, res) {
  try {
    const rows = await getAdminRecords(req.params.section);

    if (rows === null) {
      return res.status(404).json({ message: "Unknown dashboard section." });
    }

    return res.json(rows);
  } catch (error) {
    console.error("Admin dashboard query failed:", error);
    return res
      .status(500)
      .json({ message: "Could not load dashboard records." });
  }
}

export async function deleteListing(req, res) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  try {
    const removed = await removeListing(id);

    if (!removed) {
      return res.status(404).json({
        message: "This listing was already removed or does not exist.",
      });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Admin listing removal failed:", error);
    return res.status(500).json({
      message: "Could not delete the listing.",
    });
  }
}
