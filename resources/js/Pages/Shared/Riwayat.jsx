import { Head, usePage } from '@inertiajs/react';
import { Card, PageHeader, Timeline } from '../../Components/ui';

export default function Riwayat({ groups }) {
    const { role } = usePage().props.auth.user;
    return (
        <>
            <Head title="Riwayat Aktivitas" />
            <PageHeader crumbs={[['Dashboard', `/${role}`], ['Riwayat Aktivitas']]} title="Riwayat Aktivitas" desc="Catatan aktivitas akun Anda selama 30 hari terakhir." />
            <div className="max-w-3xl space-y-gutter">
                {groups.map((g) => (
                    <Card key={g.tanggal} className="p-5 sm:p-6">
                        <h2 className="eyebrow mb-4">{g.tanggal}</h2>
                        <Timeline items={g.items} />
                    </Card>
                ))}
            </div>
        </>
    );
}
