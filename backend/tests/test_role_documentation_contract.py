from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DIAGRAM_ROOT = REPOSITORY_ROOT / "diagram"

REQUIRED_SECTIONS = (
    "## Tujuan",
    "## Jenis Diagram",
    "## Elemen",
    "## Langkah Pembuatan di Visual Paradigm Online",
    "## Konektor dan Relasi",
    "## Saran Tata Letak",
    "## Penjelasan Diagram untuk Laporan",
    "## Checklist",
)

REQUIRED_NEW_GUIDES = {
    "activity-dokter": "penjelasan diagram activity dokter hewan.md",
    "activity-kepala-pekerja": "penjelasan diagram activity kepala pekerja.md",
    "sequence-validasi": "penjelasan diagram sequence validasi dokter.md",
    "sequence-tindak-lanjut": "penjelasan diagram sequence tindak lanjut.md",
    "flowchart-sistem": "penjelasan diagram flowchart sistem.md",
    "component-diagram": "penjelasan diagram component.md",
}


def _read(relative_path: str) -> str:
    return (DIAGRAM_ROOT / relative_path).read_text(encoding="utf-8").lower()


def test_legacy_mermaid_and_generic_explanations_are_removed() -> None:
    assert list(DIAGRAM_ROOT.rglob("*.mmd")) == []
    assert list(DIAGRAM_ROOT.rglob("*.drawio")) == []
    assert list(DIAGRAM_ROOT.rglob("penjelasan.md")) == []
    assert not (DIAGRAM_ROOT / "semua_penjelasan_diagram.md").exists()


def test_each_diagram_folder_has_one_complete_authoritative_guide() -> None:
    folders = sorted(path for path in DIAGRAM_ROOT.iterdir() if path.is_dir())
    assert folders, "Folder diagram tidak ditemukan"

    for folder in folders:
        guides = sorted(folder.glob("penjelasan diagram *.md"))
        assert len(guides) == 1, (
            f"{folder.relative_to(REPOSITORY_ROOT)} harus memiliki tepat satu "
            "panduan bernama 'penjelasan diagram <nama>.md'"
        )
        markdown_files = sorted(folder.glob("*.md"))
        assert markdown_files == guides, (
            f"{folder.relative_to(REPOSITORY_ROOT)} memiliki Markdown lain di luar "
            "panduan otoritatif"
        )

        content = guides[0].read_text(encoding="utf-8")
        for section in REQUIRED_SECTIONS:
            assert section in content, f"{guides[0].name} belum memiliki bagian {section}"


def test_required_new_diagram_guides_exist() -> None:
    for folder, filename in REQUIRED_NEW_GUIDES.items():
        guide = DIAGRAM_ROOT / folder / filename
        assert guide.is_file(), f"Panduan baru belum tersedia: {guide}"


def test_core_guides_describe_four_roles_and_workflow_responsibilities() -> None:
    core_guides = (
        "use-case/penjelasan diagram use case.md",
        "navigation/penjelasan diagram navigasi.md",
        "erd/penjelasan diagram erd.md",
        "sequence-login/penjelasan diagram sequence login.md",
        "class-backend/penjelasan diagram class backend.md",
        "arsitektur/penjelasan diagram arsitektur sistem.md",
        "flowchart-sistem/penjelasan diagram flowchart sistem.md",
        "component-diagram/penjelasan diagram component.md",
    )

    for guide in core_guides:
        content = _read(guide)
        for role in ("pekerja kandang", "admin", "dokter hewan", "kepala pekerja"):
            assert role in content, f"{guide} belum menjelaskan peran {role}"

    use_case = _read(core_guides[0])
    for responsibility in (
        "membuat akun staf",
        "memvalidasi",
        "sudah dipisahkan",
        "mulai penanganan",
        "penanganan selesai",
    ):
        assert responsibility in use_case

    erd = _read(core_guides[2])
    for entity in ("staff_profiles", "prediction_validations", "prediction_followups"):
        assert entity in erd

    login = _read(core_guides[3])
    for route in ("/admin", "/doctor", "/head-worker"):
        assert route in login

    flowchart = _read(core_guides[6])
    for decision in ("healthy", "tidak dapat dipastikan", "penanganan"):
        assert decision in flowchart
