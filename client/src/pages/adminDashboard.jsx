import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/AdminDashboard.css";

const sections = [
  { key: "users", label: "Users" },
  { key: "listings", label: "Listings" },
  { key: "offers", label: "Offers" },
  { key: "orders", label: "Orders" },
  { key: "reviews", label: "Reviews" },
];

function columnLabel(key) {
  if (key === "id") return "ID";

  const label = key.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AdminRecords({ section }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      try {
        const response = await fetch(`/api/admin/${section}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          setLoginRequired(response.status === 401);
          setError(data.message || "Could not load this section.");
          return;
        }

        setRows(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setError("Could not reach the server. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRecords();
    return () => controller.abort();
  }, [section]);

  async function handleDelete(row) {
    const confirmed = window.confirm(
      `Delete "${row.title}" from the marketplace?`,
    );

    if (!confirmed) return;

    setDeletingId(row.id);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/listings/${row.id}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 404) {
        setRows((currentRows) =>
          currentRows.filter((item) => item.id !== row.id),
        );
        return;
      }

      const data = await response.json();
      setDeleteError(data.message || "Could not delete the listing.");
    } catch {
      setDeleteError(
        "Could not confirm deletion. Refresh Listings to check its status.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p role="status">Loading {section}…</p>;
  }

  if (error) {
    return (
      <p role="alert">
        {error} {loginRequired && <a href="/login">Log in</a>}
      </p>
    );
  }

  if (rows.length === 0) {
    return <p>No {section} yet.</p>;
  }

  const columns = Object.keys(rows[0]);
  const isListings = section === "listings";

  return (
    <div className="admin-table-wrap">
      {deleteError && <p role="alert">{deleteError}</p>}

      <table className={`admin-table-${section}`} aria-label={`All ${section}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {columnLabel(column)}
              </th>
            ))}

            {isListings && <th scope="col">Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column} data-column={column}>
                  {row[column] ?? "—"}
                </td>
              ))}

              {isListings && (
                <td>
                  <button
                    type="button"
                    className="admin-delete"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(row)}
                    aria-label={`Delete ${row.title}`}
                  >
                    {deletingId === row.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const [section, setSection] = useState("users");

  return (
    <>
      <Navbar />

      <main className="admin-dashboard">
        <h1>Admin dashboard</h1>

        <div
          className="admin-sections"
          role="group"
          aria-label="Dashboard sections"
        >
          {sections.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={section === item.key}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <AdminRecords key={section} section={section} />
      </main>
    </>
  );
}
