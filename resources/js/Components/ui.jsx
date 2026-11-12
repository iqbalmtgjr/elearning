// Komponen UI bersama PKBM BHP. Satu file agar mudah ditelusuri; pecah bila sudah terlalu besar.
import { Link, router } from '@inertiajs/react';
import { Fragment, useEffect, useRef, useState } from 'react';

export const cx = (...c) => c.filter(Boolean).join(' ');

/** POST JSON di luar siklus Inertia (mis. simpan otomatis jawaban ujian). */
export const kirimJson = (url, data) =>
    fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
        },
        body: JSON.stringify(data),
    });

/** Opsi select bisa berupa "teks" atau [nilai, label]. */
export const opsi = (o) => (Array.isArray(o) ? o : [o, o]);

/** Render isi materi bergaya markdown ringan: "## " subjudul, "- " poin, "> " kotak penting, baris kosong = paragraf. Aman (tanpa HTML). */
export function Konten({ teks }) {
    if (!teks) return null;
    return (
        <div className="prose-materi">
            {teks.split(/\n\s*\n/).map((blok, i) => {
                const baris = blok.split('\n').filter((b) => b.trim());
                if (baris.every((b) => b.startsWith('- ')))
                    return (
                        <ul key={i}>
                            {baris.map((b, j) => (
                                <li key={j}>{b.slice(2)}</li>
                            ))}
                        </ul>
                    );
                if (baris[0]?.startsWith('## ')) {
                    const sisa = baris.slice(1);
                    return (
                        <div key={i} className="space-y-4">
                            <h2>{baris[0].slice(3)}</h2>
                            {sisa.length > 0 && (sisa.every((b) => b.startsWith('- ')) ? <ul>{sisa.map((b, j) => <li key={j}>{b.slice(2)}</li>)}</ul> : <p>{sisa.join(' ')}</p>)}
                        </div>
                    );
                }
                if (baris[0]?.startsWith('> ')) return <blockquote key={i}>{baris.map((b) => b.replace(/^>\s?/, '')).join(' ')}</blockquote>;
                return <p key={i}>{baris.join(' ')}</p>;
            })}
        </div>
    );
}

export function Icon({ n, className, fill }) {
    return (
        <span className={cx('ms', fill && 'ms-fill', className)} aria-hidden="true">
            {n}
        </span>
    );
}

export function Logo({ className }) {
    return (
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg bg-secondary-container text-primary-container', className)}>
            <Icon n="school" fill className="!text-[22px]" />
        </span>
    );
}

const TONES = {
    primary: 'bg-primary-container text-on-primary',
    lime: 'bg-secondary-container text-on-secondary-fixed',
    soft: 'bg-primary-container/10 text-primary-container',
    success: 'bg-success-container text-success-ink',
    warning: 'bg-warning-container text-warning-ink',
    danger: 'bg-danger-container text-danger-ink',
    neutral: 'bg-surface-container text-ink-2',
};

export function Badge({ tone = 'neutral', dot, className, children }) {
    return (
        <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-sm font-semibold whitespace-nowrap', TONES[tone], className)}>
            {dot && <span className="size-1.5 rounded-full bg-current" />}
            {children}
        </span>
    );
}

/** Status tugas: [label, tone, ikon] */
export const TUGAS = {
    belum: ['Belum Dikerjakan', 'neutral', 'radio_button_unchecked'],
    proses: ['Sedang Dikerjakan', 'warning', 'edit_note'],
    dikumpulkan: ['Sudah Dikumpulkan', 'soft', 'upload_file'],
    terlambat: ['Terlambat', 'danger', 'schedule'],
    dinilai: ['Sudah Dinilai', 'success', 'verified'],
};

export const MAPEL_TONE = {
    green: 'bg-primary-container text-secondary-container',
    lime: 'bg-secondary-container text-primary-container',
    mint: 'bg-primary-fixed/70 text-primary-container',
};

export function Progress({ value, size = 'md', dark, className }) {
    return (
        <div
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cx('w-full overflow-hidden rounded-full', size === 'sm' ? 'h-1.5' : 'h-2', dark ? 'bg-white/15' : 'bg-surface-container', className)}
        >
            <div
                className={cx('h-full rounded-full transition-[width] duration-700', value >= 100 ? 'bg-success' : 'bg-secondary-container', !dark && value < 100 && 'shadow-[inset_0_0_0_1px_rgb(82_102_0/0.3)]')}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

export function Card({ as: Tag = 'section', className, children, ...props }) {
    return (
        <Tag className={cx('card', className)} {...props}>
            {children}
        </Tag>
    );
}

export function Stat({ label, value, unit, icon, children, className }) {
    return (
        <div className={cx('card flex flex-col justify-between gap-4 p-5', className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="eyebrow">{label}</p>
                    <p className="mt-1.5 text-headline-xl text-on-surface">
                        {value}
                        {unit && <span className="ml-1.5 text-label-md font-medium text-on-surface-variant">{unit}</span>}
                    </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-container-low text-primary-container">
                    <Icon n={icon} />
                </span>
            </div>
            {children}
        </div>
    );
}

export function Breadcrumb({ items }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto text-caption tracking-wider whitespace-nowrap text-on-surface-variant uppercase scrollbar-none">
            {items.map(([label, href], i) => (
                <Fragment key={i}>
                    {i > 0 && <span className="text-outline">/</span>}
                    {href ? (
                        <Link href={href} className="hover:text-primary-container">
                            {label}
                        </Link>
                    ) : (
                        <span className="font-bold text-primary-container">{label}</span>
                    )}
                </Fragment>
            ))}
        </nav>
    );
}

export function PageHeader({ crumbs, chips, title, desc, actions, className }) {
    return (
        <div className={cx('mb-6 space-y-3', className)}>
            {crumbs && <Breadcrumb items={crumbs} />}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 space-y-2">
                    {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-headline-xl">{title}</h1>
                    {desc && <p className="max-w-2xl text-on-surface-variant">{desc}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </div>
    );
}

export function SectionTitle({ title, desc, icon, action, className }) {
    return (
        <div className={cx('mb-4 flex items-end justify-between gap-4', className)}>
            <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-headline-md text-on-surface">
                    {icon && <Icon n={icon} className="text-primary-container" />}
                    {title}
                </h2>
                {desc && <p className="mt-0.5 text-label-sm text-on-surface-variant">{desc}</p>}
            </div>
            {action}
        </div>
    );
}

export function initials(name) {
    return name
        .replace(/\b(Drs|Dra|Dr|Hj|Ust)\.\s*/g, '')
        .split(',')[0]
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('');
}

const AVATAR = { xs: 'size-7 text-[10px]', sm: 'size-9 text-xs', md: 'size-11 text-sm', lg: 'size-16 text-xl', xl: 'size-24 text-3xl' };

export function Avatar({ name, size = 'md', className }) {
    const dark = name.length % 2 === 0;
    return (
        <span
            className={cx('grid shrink-0 place-items-center rounded-full font-bold', AVATAR[size], dark ? 'bg-primary-container text-on-primary' : 'bg-secondary-container text-on-secondary-fixed', className)}
            aria-hidden="true"
        >
            {initials(name)}
        </span>
    );
}

export function Empty({ icon = 'inbox', title, desc, action, className }) {
    return (
        <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface-container-low text-primary-container">
                <Icon n={icon} className="!text-[28px]" />
            </span>
            <p className="text-headline-md text-on-surface">{title}</p>
            {desc && <p className="mt-1 max-w-sm text-on-surface-variant">{desc}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Skeleton({ className }) {
    return <div className={cx('animate-pulse rounded-md bg-surface-container', className)} />;
}

/** Modal memakai <dialog> native: fokus terkunci, Esc menutup, latar diredupkan. */
export function Modal({ open, onClose, title, desc, icon, children, footer, size = 'md' }) {
    const ref = useRef(null);
    useEffect(() => {
        const d = ref.current;
        if (open && !d.open) d.showModal();
        if (!open && d.open) d.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
            className={cx('m-auto max-h-[90dvh] w-[calc(100%-2rem)] rounded-2xl bg-surface-container-lowest p-0 text-on-surface shadow-modal', { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size])}
        >
            {open && (
                <div className="flex max-h-[90dvh] flex-col">
                    <div className="flex items-start gap-3 border-b border-outline-variant/70 p-5">
                        {icon && (
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-container-low text-primary-container">
                                <Icon n={icon} />
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            <h2 className="text-headline-md">{title}</h2>
                            {desc && <p className="mt-0.5 text-label-sm text-on-surface-variant">{desc}</p>}
                        </div>
                        <button type="button" className="btn-icon -m-2" onClick={onClose} aria-label="Tutup">
                            <Icon n="close" />
                        </button>
                    </div>
                    {children && <div className="overflow-y-auto p-5">{children}</div>}
                    {footer && <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 p-4 sm:flex-row sm:justify-end">{footer}</div>}
                </div>
            )}
        </dialog>
    );
}

export function Confirm({ open, onClose, onConfirm, title, desc, confirmLabel = 'Ya, Lanjutkan', danger, icon = 'help' }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            desc={desc}
            icon={icon}
            size="sm"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Batal
                    </button>
                    <button type="button" className={cx('btn', danger ? 'btn-danger' : 'btn-primary')} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </>
            }
        />
    );
}

export function Field({ label, hint, error, className, children }) {
    return (
        <label className={cx('block', className)}>
            <span className="label">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-label-sm text-on-surface-variant">{hint}</span>}
            {error && <span className="mt-1 block text-label-sm font-medium text-danger-ink">{error}</span>}
        </label>
    );
}

export function SearchInput({ value, onChange, placeholder = 'Cari…', className }) {
    return (
        <div className={cx('relative', className)}>
            <Icon n="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline" />
            <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input pl-10" />
        </div>
    );
}

export function Tabs({ tabs, value, onChange, className }) {
    return (
        <div role="tablist" className={cx('flex max-w-full gap-1 overflow-x-auto rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-1 scrollbar-none', className)}>
            {tabs.map(([key, label, count]) => {
                const on = value === key;
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(key)}
                        className={cx(
                            'flex items-center gap-2 rounded-lg px-3.5 py-2 text-label-md whitespace-nowrap transition',
                            on ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                        )}
                    >
                        {label}
                        {count != null && <span className={cx('rounded-full px-1.5 text-caption', on ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container')}>{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

export function Toggle({ label, desc, defaultChecked }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 py-3.5">
            <span>
                <span className="block text-label-md">{label}</span>
                {desc && <span className="mt-0.5 block text-label-sm text-on-surface-variant">{desc}</span>}
            </span>
            <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
            <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-surface-container-highest transition peer-checked:bg-primary-container peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-container after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
        </label>
    );
}

export function FileDrop({ name = 'file', accept, hint = 'PDF, DOCX, JPG, atau PNG · maksimal 10 MB', onFile }) {
    const [file, setFile] = useState(null);
    const [drag, setDrag] = useState(false);
    const pick = (f) => {
        if (!f) return;
        setFile(f);
        onFile?.(f);
    };
    return (
        <label
            onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pick(e.dataTransfer.files[0]);
            }}
            className={cx(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition',
                drag ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant hover:border-primary-container/40 hover:bg-surface-container-low',
            )}
        >
            <input type="file" name={name} accept={accept} className="sr-only" onChange={(e) => pick(e.target.files[0])} />
            <span className={cx('grid size-12 place-items-center rounded-full', file ? 'bg-secondary-container text-primary-container' : 'bg-surface-container-low text-primary-container')}>
                <Icon n={file ? 'description' : 'cloud_upload'} />
            </span>
            {file ? (
                <>
                    <p className="text-label-md break-all">{file.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{Math.max(1, Math.round(file.size / 1024))} KB · klik untuk mengganti file</p>
                </>
            ) : (
                <>
                    <p className="text-label-md">
                        Seret file ke sini atau <span className="text-primary-container underline underline-offset-2">pilih dari perangkat</span>
                    </p>
                    <p className="text-label-sm text-on-surface-variant">{hint}</p>
                </>
            )}
        </label>
    );
}

export function Dropdown({ trigger, children, className }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
        const esc = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);
    return (
        <div ref={ref} className="relative">
            {trigger({ open, toggle: () => setOpen(!open) })}
            {open && (
                <div className={cx('absolute top-full right-0 z-50 mt-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-pop', className)} onClick={() => setOpen(false)}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function MenuItem({ icon, href, method, danger, external, children, onClick }) {
    const cls = cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-label-md transition', danger ? 'text-danger-ink hover:bg-danger-container' : 'hover:bg-surface-container-low');
    const inner = (
        <>
            <Icon n={icon} className={danger ? '' : 'text-on-surface-variant'} />
            {children}
        </>
    );
    if (!href)
        return (
            <button type="button" className={cls} onClick={onClick}>
                {inner}
            </button>
        );
    if (external)
        return (
            <a href={href} target="_blank" rel="noreferrer" className={cls}>
                {inner}
            </a>
        );
    return (
        <Link href={href} method={method} as={method ? 'button' : 'a'} className={cls}>
            {inner}
        </Link>
    );
}

// ── Tabel data dengan tampilan kartu di layar kecil ─────────────────────
export function Cell({ v }) {
    if (v == null) return <span className="text-outline">—</span>;
    if (typeof v !== 'object') return <span>{v}</span>;
    if ('user' in v)
        return (
            <div className="flex min-w-0 items-center gap-3">
                <Avatar name={v.user} size="sm" />
                <div className="min-w-0">
                    <p className="truncate text-label-md">{v.user}</p>
                    {v.sub && <p className="truncate text-label-sm text-on-surface-variant">{v.sub}</p>}
                </div>
            </div>
        );
    if ('badge' in v) return <Badge tone={v.tone}>{v.badge}</Badge>;
    if ('progress' in v)
        return (
            <div className="flex min-w-28 items-center gap-2.5">
                <Progress value={v.progress} size="sm" className="flex-1" />
                <span className="w-9 text-right text-label-sm font-semibold">{v.progress}%</span>
            </div>
        );
    return (
        <div className="min-w-0">
            <p className="line-clamp-2 text-label-md">{v.text}</p>
            {v.sub && <p className="mt-0.5 text-label-sm text-on-surface-variant">{v.sub}</p>}
        </div>
    );
}

const cellText = (v) => (v == null ? '' : typeof v !== 'object' ? String(v) : [v.user, v.sub, v.badge, v.text].filter(Boolean).join(' '));
export const rowText = (row) => Object.values(row).map(cellText).join(' ').toLowerCase();

export function DataTable({ columns, rows, actions }) {
    const [first, ...rest] = columns;
    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low/70">
                            {columns.map(([k, label]) => (
                                <th key={k} scope="col" className="eyebrow px-5 py-3">
                                    {label}
                                </th>
                            ))}
                            {actions && (
                                <th scope="col" className="px-5 py-3">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/70">
                        {rows.map((r, i) => (
                            <tr key={i} onClick={r.href ? () => (r.external ? window.open(r.href, '_blank') : router.visit(r.href)) : undefined} className={cx('transition-colors hover:bg-surface/60', r.href && 'cursor-pointer')}>
                                {columns.map(([k]) => (
                                    <td key={k} className="max-w-xs px-5 py-3.5 align-middle">
                                        <Cell v={r[k]} />
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                        {actions(r)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ul className="divide-y divide-outline-variant/70 md:hidden">
                {rows.map((r, i) => (
                    <li key={i} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            {r.href && r.external ? (
                                <a href={r.href} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                                    <Cell v={r[first[0]]} />
                                </a>
                            ) : r.href ? (
                                <Link href={r.href} className="min-w-0 flex-1">
                                    <Cell v={r[first[0]]} />
                                </Link>
                            ) : (
                                <div className="min-w-0 flex-1">
                                    <Cell v={r[first[0]]} />
                                </div>
                            )}
                            {actions?.(r)}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                            {rest.map(([k, label]) => (
                                <div key={k} className="min-w-0">
                                    <dt className="text-caption tracking-wider text-on-surface-variant uppercase">{label}</dt>
                                    <dd className="mt-1 text-label-md">
                                        <Cell v={r[k]} />
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </li>
                ))}
            </ul>
        </>
    );
}

// ponytail: paginasi visual; sambungkan ke paginator Laravel saat data berasal dari database.
export function Pagination({ shown, total, label = 'data' }) {
    const [page, setPage] = useState(1);
    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/70 px-5 py-4 sm:flex-row">
            <p className="text-label-sm text-on-surface-variant">
                Menampilkan <b className="text-on-surface">{shown}</b> dari <b className="text-on-surface">{total}</b> {label}
            </p>
            <nav aria-label="Paginasi" className="flex items-center gap-1">
                <button type="button" className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <Icon n="chevron_left" className="!text-[18px]" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                {[1, 2, 3].map((p) => (
                    <button
                        key={p}
                        type="button"
                        aria-current={page === p ? 'page' : undefined}
                        onClick={() => setPage(p)}
                        className={cx('size-8 rounded-lg text-label-sm font-semibold transition', page === p ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-container-low')}
                    >
                        {p}
                    </button>
                ))}
                <button type="button" className="btn btn-sm btn-ghost" disabled={page === 3} onClick={() => setPage(page + 1)}>
                    <span className="hidden sm:inline">Berikutnya</span>
                    <Icon n="chevron_right" className="!text-[18px]" />
                </button>
            </nav>
        </div>
    );
}

/** Baris kecil ikon + teks untuk linimasa aktivitas. */
export function Timeline({ items }) {
    return (
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-outline-variant">
            {items.map((it, i) => (
                <li key={i} className="relative flex gap-3">
                    <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary-container">
                        <Icon n={it.icon} className="!text-[18px]" />
                    </span>
                    <div className="min-w-0 pt-1">
                        <p className="text-label-md font-medium">{it.teks}</p>
                        <p className="mt-0.5 text-label-sm text-on-surface-variant">{it.waktu}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
