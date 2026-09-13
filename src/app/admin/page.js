"use client";

// Admin panel. Publishes the shared library every student reads.
//
// Access is a document at admins/{uid} — the Firestore rules check the same
// thing, so hiding this page is a convenience, not the security boundary.
// Bootstrapping the first admin is deliberately manual (one document, created in
// the Firebase console): a self-serve path would be a self-serve privilege
// escalation.

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, Segmented, Stat } from "@/components/ui";
import {
  BranchSelector,
  ErrorNote,
  HobbySelector,
  KindPill,
  LibraryState,
  PdfField,
  SemesterSelector,
} from "@/components/library";
import { HOBBIES, RESOURCE_KINDS, UNITS, kindById, subjectsFor } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  createItem,
  deleteItem,
  isStorageConfigured,
  removeFile,
  updateItem,
  uploadPdf,
  useAdmin,
  useAllLibrary,
  youtubeId,
} from "@/lib/library";

export default function Admin() {
  const { user, ready: authReady, available } = useAuth();
  const { isAdmin, ready: adminReady } = useAdmin();

  if (!available) {
    return (
      <Gate
        emoji="☁️"
        title="Firebase isn't configured"
        hint="Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local to use the admin panel."
      />
    );
  }
  if (!authReady || !adminReady) {
    return <div className="animate-pulse py-16 text-center text-sm text-muted">Checking access…</div>;
  }
  if (!user) {
    return (
      <Gate
        emoji="🔒"
        title="Sign in required"
        hint="Sign in from the Profile page, then come back."
      />
    );
  }
  if (!isAdmin) return <NotAdmin uid={user.uid} />;

  return <AdminPanel uid={user.uid} />;
}

function Gate({ emoji, title, hint }) {
  return (
    <Card>
      <Empty emoji={emoji} title={title} hint={hint} />
    </Card>
  );
}

function NotAdmin({ uid }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted">This account isn&rsquo;t an admin.</p>
      </header>
      <Card className="space-y-3">
        <p className="text-sm">
          To grant access, create a document in Firestore at{" "}
          <code className="rounded bg-surface2 px-1 py-0.5 text-xs">admins/{"{uid}"}</code> — it can
          be empty. Your uid:
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface2 px-3 py-2 text-xs">
            {uid}
          </code>
          <button
            className="btn btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(uid);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Firebase console → Firestore Database → Start collection{" "}
          <code className="rounded bg-surface2 px-1">admins</code> → Document ID = the uid above.
        </p>
      </Card>
    </div>
  );
}

// --------------------------------------------------------------- panel --

const SCOPES = [
  { value: "subject", label: "Course material", emoji: "🎓" },
  { value: "hobby", label: "Hobby material", emoji: "🎨" },
];

function AdminPanel({ uid }) {
  const { state } = useApp();
  const { items, status, error } = useAllLibrary(true);
  const [editing, setEditing] = useState(null);
  const [scope, setScope] = useState("subject");
  const [branch, setBranch] = useState(state.profile.branch);
  const [semester, setSemester] = useState(state.profile.semester);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const visible = useMemo(
    () =>
      items.filter((i) =>
        scope === "hobby"
          ? i.scope === "hobby"
          : i.scope === "subject" && i.branch === branch && i.semester === Number(semester),
      ),
    [items, scope, branch, semester],
  );

  const published = items.filter((i) => i.published).length;

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title}"? This also deletes its uploaded PDF.`)) return;
    setBusyId(item.id);
    setActionError("");
    try {
      await deleteItem(item);
    } catch (e) {
      setActionError(e.message);
    }
    setBusyId(null);
  };

  const togglePublished = async (item) => {
    setBusyId(item.id);
    setActionError("");
    try {
      await updateItem(item.id, { published: !item.published });
    } catch (e) {
      setActionError(e.message);
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted">
            Publish syllabus, notes, PYQs and videos. Students see them filtered by branch and
            semester.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          ＋ Add resource
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total items" value={items.length} emoji="📦" />
        <Stat label="Published" value={published} emoji="✅" />
        <Stat label="Drafts" value={items.length - published} emoji="📝" />
      </div>

      <Segmented options={SCOPES} value={scope} onChange={setScope} />

      {scope === "subject" ? (
        <Card className="grid gap-3 sm:grid-cols-2">
          <Field label="Branch">
            <BranchSelector value={branch} onChange={setBranch} />
          </Field>
          <Field label="Semester">
            <SemesterSelector value={semester} onChange={setSemester} />
          </Field>
        </Card>
      ) : null}

      <ErrorNote>{actionError}</ErrorNote>

      <LibraryState status={status} error={error}>
        {visible.length ? (
          <div className="space-y-2">
            {visible.map((item) => (
              <Card key={item.id} className="flex items-start gap-3">
                <span className="text-xl leading-none" aria-hidden>
                  {kindById(item.kind).emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 truncate font-medium">{item.title}</p>
                    {item.published ? null : (
                      <span className="text-[11px] font-semibold text-muted">DRAFT</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {[
                      item.scope === "hobby"
                        ? HOBBIES.find((h) => h.id === item.hobby)?.label
                        : item.subject,
                      item.unit ? `Unit ${item.unit}` : null,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <KindPill kind={item.kind} />
                    <button
                      className="btn btn-sm"
                      disabled={busyId === item.id}
                      onClick={() => setEditing(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={busyId === item.id}
                      onClick={() => togglePublished(item)}
                    >
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-muted"
                      disabled={busyId === item.id}
                      onClick={() => remove(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Empty
              emoji="📦"
              title="Nothing here yet"
              hint="Add your first resource for this branch and semester."
            />
          </Card>
        )}
      </LibraryState>

      <ItemModal
        open={!!editing}
        item={editing}
        uid={uid}
        defaults={{ scope, branch, semester }}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------- form --

function ItemModal({ open, item, uid, defaults, onClose }) {
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const model =
    form ??
    (item?.id
      ? { ...item, youtubeUrl: item.youtubeId || "" }
      : {
          scope: defaults.scope,
          kind: defaults.scope === "hobby" ? "video" : "notes",
          branch: defaults.branch,
          semester: defaults.semester,
          subject: "",
          unit: "",
          hobby: HOBBIES[0].id,
          title: "",
          description: "",
          url: "",
          youtubeUrl: "",
          channel: "",
          published: true,
        });

  const set = (patch) => setForm({ ...model, ...patch });
  const kindMeta = kindById(model.kind);
  const subjects = useMemo(
    () => subjectsFor(model.branch, Number(model.semester)),
    [model.branch, model.semester],
  );

  const reset = () => {
    setForm(null);
    setFile(null);
    setProgress(null);
    setError("");
    setSaving(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!model.title.trim()) return setError("Give the resource a title.");

    let vid = "";
    if (model.kind === "video") {
      vid = youtubeId(model.youtubeUrl);
      if (!vid) return setError("That doesn't look like a YouTube link.");
    }

    let uploaded = null;
    if (file) {
      if (!isStorageConfigured) return setError("Firebase Storage isn't configured.");
      try {
        setProgress(0);
        uploaded = await uploadPdf("library", file, setProgress);
      } catch (err) {
        setProgress(null);
        return setError(err.message);
      }
      setProgress(null);
      if (item?.storagePath) await removeFile(item.storagePath);
    }

    const url = uploaded?.url || model.url.trim() || (uploaded ? "" : item?.url || "");
    if (model.kind !== "video" && !url) {
      return setError("Attach a PDF or paste a link.");
    }

    const payload = {
      scope: model.scope,
      kind: model.kind,
      title: model.title.trim(),
      description: model.description.trim(),
      published: !!model.published,
      // Only one of these axes is meaningful per scope; the other is written as
      // null so an edited item never keeps a stale branch or hobby tag.
      branch: model.scope === "subject" ? model.branch : null,
      semester: model.scope === "subject" ? Number(model.semester) : null,
      subject: model.scope === "subject" ? model.subject || null : null,
      unit: model.unit ? Number(model.unit) : null,
      hobby: model.scope === "hobby" ? model.hobby : null,
      youtubeId: model.kind === "video" ? vid : null,
      channel: model.channel.trim() || null,
      url: model.kind === "video" ? null : url,
      fileName: uploaded?.fileName ?? item?.fileName ?? null,
      storagePath: uploaded?.storagePath ?? item?.storagePath ?? null,
    };

    setSaving(true);
    try {
      if (item?.id) await updateItem(item.id, payload);
      else await createItem(payload, uid);
      reset();
      onClose();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  const busy = saving || progress !== null;

  return (
    <Modal
      open={open}
      onClose={close}
      title={item?.id ? "Edit resource" : "Add resource"}
      footer={
        <>
          <button className="btn" type="button" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" form="item-form" type="submit" disabled={busy}>
            {progress !== null ? "Uploading…" : saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="item-form" className="space-y-3" onSubmit={submit}>
        {/* Not wrapped in <Field>: that renders a <label>, and a label around
            buttons forwards the click to the first control inside it. */}
        <div>
          <span className="label">Scope</span>
          <Segmented
            value={model.scope}
            onChange={(v) =>
              set({ scope: v, kind: v === "hobby" && model.kind === "syllabus" ? "video" : model.kind })
            }
            options={SCOPES}
          />
        </div>

        <Field label="Type">
          <select className="select" value={model.kind} onChange={(e) => set({ kind: e.target.value })}>
            {RESOURCE_KINDS.filter((k) => model.scope === "subject" || k.id !== "syllabus").map((k) => (
              <option key={k.id} value={k.id}>
                {k.emoji} {k.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title">
          <input
            className="input"
            value={model.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={model.kind === "video" ? "Data Structures — Full Course" : "Unit 1 Notes"}
          />
        </Field>

        {model.scope === "subject" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Branch">
                <BranchSelector value={model.branch} onChange={(v) => set({ branch: v, subject: "" })} />
              </Field>
              <Field label="Semester">
                <SemesterSelector
                  value={model.semester}
                  onChange={(v) => set({ semester: v, subject: "" })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Subject"
                hint={model.kind === "syllabus" ? "Optional for a whole-semester syllabus." : undefined}
              >
                <select
                  className="select"
                  value={model.subject || ""}
                  onChange={(e) => set({ subject: e.target.value })}
                >
                  <option value="">
                    {model.kind === "syllabus" ? "Whole semester" : "— pick a subject —"}
                  </option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit">
                <select
                  className="select"
                  value={model.unit || ""}
                  onChange={(e) => set({ unit: e.target.value })}
                >
                  <option value="">No specific unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      Unit {u}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        ) : (
          <Field label="Hobby">
            <HobbySelector value={model.hobby} onChange={(v) => set({ hobby: v })} />
          </Field>
        )}

        {model.kind === "video" ? (
          <>
            <Field label="YouTube link">
              <input
                className="input"
                value={model.youtubeUrl}
                onChange={(e) => set({ youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </Field>
            <Field label="Channel" hint="Shown under the video title.">
              <input
                className="input"
                value={model.channel}
                onChange={(e) => set({ channel: e.target.value })}
                placeholder="Gate Smashers"
              />
            </Field>
          </>
        ) : (
          <>
            {kindMeta.file ? (
              <PdfField file={file} onFile={setFile} progress={progress} hint="PDF only, up to 20 MB." />
            ) : null}
            <Field
              label={kindMeta.file ? "…or paste a link" : "Link"}
              hint={item?.url && !file ? `Currently: ${item.url.slice(0, 60)}…` : undefined}
            >
              <input
                className="input"
                value={model.url}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </>
        )}

        <Field label="Description">
          <textarea
            className="textarea"
            rows={2}
            value={model.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Optional — a line about what this covers."
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!model.published}
            onChange={(e) => set({ published: e.target.checked })}
          />
          Published (visible to students)
        </label>

        <ErrorNote>{error}</ErrorNote>
      </form>
    </Modal>
  );
}
