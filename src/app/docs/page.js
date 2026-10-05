"use client";

// College Docs: the student's own timetable PDFs, plus the syllabus published
// for their branch and semester.
//
// The two halves are stored very differently on purpose. A timetable belongs to
// one student, so its metadata rides along in planner state and only the file
// goes to Storage. Syllabus is the same document for a whole branch, so it lives
// in the shared library and an admin publishes it once.

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, PageHeader, Segmented } from "@/components/ui";
import { Plus, FileText, RefreshCw, Trash2 } from "lucide-react";
import {
  BranchSelector,
  CloudNote,
  CollegePicker,
  ErrorNote,
  LibraryItem,
  PdfField,
  SemesterSelector,
} from "@/components/library";
import { BRANCHES } from "@/lib/catalog";
import {
  collegeById,
  collegeLabel,
  collegeResources,
  universityById,
  universityResources,
} from "@/lib/colleges";
import { academicYear } from "@/lib/time";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  isStorageConfigured,
  removeFile,
  uploadPdf,
  useReactions,
  useSubjectResources,
} from "@/lib/library";

const TABS = [
  { value: "schedule", label: "College Schedule", emoji: "📅" },
  { value: "syllabus", label: "Syllabus", emoji: "📘" },
  { value: "college", label: "My College", emoji: "🏛️" },
];

export default function CollegeDocs() {
  const { state } = useApp();
  const [tab, setTab] = useState("schedule");

  return (
    <div className="space-y-4">
      <PageHeader
        title="College Documents"
        emoji="🏛️"
        subtitle="Your timetable, your syllabus, and your university's own paperwork."
      />

      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === "schedule" ? (
        <ScheduleTab />
      ) : tab === "syllabus" ? (
        <SyllabusTab profile={state.profile} />
      ) : (
        <CollegeTab />
      )}
    </div>
  );
}

// ------------------------------------------------------------- college --

function CollegeTab() {
  const { state, dispatch } = useApp();
  const p = state.profile;
  const reactions = useReactions(state, dispatch);

  const uni = universityById(p.university);
  const college = collegeById(p.college);
  const name = collegeLabel(p);

  const items = useMemo(
    () => [...collegeResources(college), ...universityResources(p.university)],
    [college, p.university],
  );

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div>
          <p className="font-medium">
            {uni.emoji} {name || uni.name}
          </p>
          <p className="text-sm text-muted">
            {college ? `${college.city} · ` : ""}
            {college?.gov ? "Government institute · " : ""}
            {uni.full}
          </p>
        </div>
        <CollegePicker value={p} onChange={(patch) => dispatch({ type: "profile", payload: patch })} />
        <p className="text-xs text-muted">
          {uni.note}{" "}
          {uni.affiliating
            ? "The list here is the best-known colleges, not the full register — check the university site for the authoritative one, and type yours in if it's missing."
            : ""}
        </p>
      </Card>

      {!college && !name ? (
        <Card>
          <Empty
            emoji="🏛️"
            title="Pick your college above"
            hint="You'll get its notices, papers and placement info alongside the university's own."
          />
        </Card>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <LibraryItem key={item.id} item={item} reactions={reactions} />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ schedule --

function ScheduleTab() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [editing, setEditing] = useState(null); // doc being replaced, or {} for new

  const docs = state.docs;

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Your timetable</p>
          <p className="text-sm text-muted">
            Upload the PDF your college gave you, or paste a link to it.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} /> Add document
        </button>
      </Card>

      {docs.length ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <DocCard
              key={d.id}
              doc={d}
              onReplace={() => setEditing(d)}
              onDelete={async () => {
                if (d.storagePath) await removeFile(d.storagePath);
                dispatch({ type: "doc.delete", payload: { id: d.id } });
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            emoji="📄"
            title="No documents yet"
            hint="Add your semester timetable so it's always one tap away."
          />
        </Card>
      )}

      <DocModal
        open={!!editing}
        doc={editing}
        uid={user?.uid}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          if (editing?.id) dispatch({ type: "doc.update", payload: { id: editing.id, patch: payload } });
          else dispatch({ type: "doc.add", payload });
          setEditing(null);
        }}
      />
    </div>
  );
}

function DocCard({ doc, onReplace, onDelete }) {
  const branch = BRANCHES.find((b) => b.id === doc.branch);
  const bits = [
    branch?.label.replace(/\s*\(.*\)$/, ""),
    doc.semester ? `Semester ${doc.semester}` : null,
    doc.academicYear || null,
  ].filter(Boolean);

  return (
    <Card className="flex items-start gap-3">
      <span className="text-2xl leading-none" aria-hidden>
        📄
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{doc.title}</p>
        {doc.collegeName ? <p className="text-sm text-muted">{doc.collegeName}</p> : null}
        <p className="truncate text-xs text-muted">{bits.join(" • ")}</p>
        <p className="mt-0.5 text-xs text-muted">
          Added {new Date(doc.addedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          {doc.fileName ? ` • ${doc.fileName}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {doc.url ? (
            <a className="btn btn-sm" href={doc.url} target="_blank" rel="noopener noreferrer">
              📄 View PDF
            </a>
          ) : null}
          <button className="btn btn-sm" onClick={onReplace}>
            <RefreshCw size={14} /> Replace
          </button>
          <button className="btn btn-ghost btn-sm text-muted hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-colors" onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </Card>
  );
}

function DocModal({ open, doc, uid, onClose, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  // Seeded once per opening rather than in an effect: `open` flipping to true is
  // the only moment the defaults matter.
  const model =
    form ??
    (doc?.id
      ? { ...doc }
      : {
          title: "College Timetable",
          collegeName: "",
          branch: state.profile.branch,
          semester: state.profile.semester,
          academicYear: academicYear(),
        });

  const set = (patch) => setForm({ ...model, ...patch });

  const reset = () => {
    setForm(null);
    setFile(null);
    setLink("");
    setProgress(null);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!model.title.trim()) return setError("Give the document a name.");

    let uploaded = null;
    if (file) {
      if (!uid) return setError("Sign in first — uploads are stored against your account.");
      if (!isStorageConfigured) return setError("Firebase Storage isn't configured; paste a link instead.");
      try {
        setProgress(0);
        uploaded = await uploadPdf(`users/${uid}/docs`, file, setProgress);
      } catch (err) {
        setProgress(null);
        return setError(err.message);
      }
      setProgress(null);
      // Replacing: the old file is dead weight the moment the new URL is saved.
      if (doc?.storagePath) await removeFile(doc.storagePath);
    }

    const url = uploaded?.url || link.trim() || doc?.url || "";
    if (!url) return setError("Attach a PDF or paste a link to one.");

    onSave({
      title: model.title.trim(),
      collegeName: model.collegeName.trim(),
      branch: model.branch,
      semester: Number(model.semester),
      academicYear: model.academicYear.trim(),
      url,
      fileName: uploaded?.fileName || (link.trim() ? "" : doc?.fileName || ""),
      storagePath: uploaded?.storagePath || (link.trim() ? "" : doc?.storagePath || ""),
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={doc?.id ? "Replace document" : "Add college document"}
      footer={
        <>
          <button className="btn" onClick={close} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" form="doc-form" type="submit" disabled={progress !== null}>
            {progress !== null ? "Uploading…" : "Save"}
          </button>
        </>
      }
    >
      <form id="doc-form" className="space-y-3" onSubmit={submit}>
        <Field label="Document name">
          <input
            className="input"
            value={model.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Semester 3 College Timetable"
          />
        </Field>
        <Field label="College name">
          <input
            className="input"
            value={model.collegeName}
            onChange={(e) => set({ collegeName: e.target.value })}
            placeholder="Your college"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Branch">
            <BranchSelector value={model.branch} onChange={(v) => set({ branch: v })} />
          </Field>
          <Field label="Semester">
            <SemesterSelector value={model.semester} onChange={(v) => set({ semester: v })} />
          </Field>
        </div>
        <Field label="Academic year">
          <input
            className="input"
            value={model.academicYear}
            onChange={(e) => set({ academicYear: e.target.value })}
            placeholder="2026-2027"
          />
        </Field>

        <PdfField
          file={file}
          onFile={setFile}
          progress={progress}
          hint={
            uid
              ? "PDF only, up to 20 MB."
              : "Sign in to upload a file — or paste a link below instead."
          }
        />

        <Field label="…or paste a PDF link" hint="Google Drive, OneDrive, your college portal — anything public.">
          <input
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------ syllabus --

function SyllabusTab({ profile }) {
  const { state, dispatch } = useApp();
  const [branch, setBranch] = useState(profile.branch);
  const [semester, setSemester] = useState(profile.semester);
  const reactions = useReactions(state, dispatch);

  const { items, status, error } = useSubjectResources(branch, semester);
  const syllabus = useMemo(() => items.filter((i) => i.kind === "syllabus"), [items]);

  return (
    <div className="space-y-3">
      <Card className="grid gap-3 sm:grid-cols-2">
        <Field label="Branch">
          <BranchSelector value={branch} onChange={setBranch} />
        </Field>
        <Field label="Semester">
          <SemesterSelector value={semester} onChange={setSemester} />
        </Field>
      </Card>

      <CloudNote status={status} error={error} />

      {syllabus.length ? (
        <div className="space-y-2">
          {syllabus.map((item) => (
            <LibraryItem key={item.id} item={item} reactions={reactions} />
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            emoji="📘"
            title="No syllabus published yet"
            hint="An admin adds syllabus PDFs per branch and semester from the Admin panel."
          />
        </Card>
      )}
    </div>
  );
}
