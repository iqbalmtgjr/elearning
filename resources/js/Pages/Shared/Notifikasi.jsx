import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Card, Empty, Icon, PageHeader, Tabs, cx } from '../../Components/ui';

const TONE = {
    danger: 'bg-danger-container text-danger-ink',
    success: 'bg-success-container text-success-ink',
    warning: 'bg-warning-container text-warning-ink',
    primary: 'bg-primary-container text-secondary-container',
    lime: 'bg-secondary-container text-primary-container',
    neutral: 'bg-surface-container text-ink-2',
};

export default function Notifikasi({ items }) {
    const { role } = usePage().props.auth.user;
    const [tab, setTab] = useState('semua');
    const list = items.filter((n) => tab === 'semua' || n.baru);

    return (
        <>
            <Head title="Notifikasi" />
            <PageHeader
                crumbs={[['Dashboard', `/${role}`], ['Notifikasi']]}
                title="Pusat Notifikasi"
                desc="Pengingat tugas, nilai, balasan diskusi, dan pengumuman terbaru."
                actions={
                    <button type="button" className="btn btn-ghost" onClick={() => router.post('/notifikasi/baca-semua', {}, { preserveScroll: true })} disabled={!items.some((n) => n.baru)}>
                        <Icon n="done_all" className="!text-[18px]" />
                        Tandai semua dibaca
                    </button>
                }
            />
            <Tabs
                className="mb-4 w-fit"
                value={tab}
                onChange={setTab}
                tabs={[
                    ['semua', 'Semua', items.length],
                    ['baru', 'Belum Dibaca', items.filter((n) => n.baru).length],
                ]}
            />
            <Card className="max-w-4xl overflow-hidden">
                {list.length ? (
                    <ul className="divide-y divide-outline-variant/70">
                        {list.map((n) => (
                            <li key={n.id}>
                                <Link href={`/notifikasi/${n.id}`} className={cx('flex gap-4 p-4 transition hover:bg-surface-container-low sm:p-5', n.baru && 'bg-secondary-container/10')}>
                                    <span className={cx('grid size-11 shrink-0 place-items-center rounded-full', TONE[n.tone] ?? TONE.neutral)}>
                                        <Icon n={n.icon} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-label-md text-[14px]">{n.judul}</p>
                                            <span className="shrink-0 text-label-sm text-on-surface-variant">{n.waktu}</span>
                                        </div>
                                        <p className="mt-0.5 text-body-md text-on-surface-variant">{n.teks}</p>
                                    </div>
                                    {n.baru && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary-container" aria-label="Belum dibaca" />}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Empty icon="notifications_off" title={tab === 'baru' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'} desc="Notifikasi baru akan muncul di sini." />
                )}
            </Card>
        </>
    );
}
