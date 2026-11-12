<?php

namespace App\Http\Controllers;

use App\Support\Akademik;
use App\Support\Resources;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/** CRUD generik untuk halaman data admin & tutor; aturan per halaman ada di App\Support\Resources. */
class ResourceController extends Controller
{
    private function def(Request $r, string $resource): array
    {
        abort_unless(in_array($resource, $r->user()->role === 'admin' ? Resources::ADMIN : Resources::TUTOR), 404);

        return Resources::make($resource, $r->user());
    }

    public function index(Request $r, string $resource)
    {
        $def = $this->def($r, $resource);
        $items = $def['query']()->get();
        $ctx = isset($def['prepare']) ? $def['prepare']($items) : null;
        $edit = $def['edit'] ?? true;

        return inertia('Resource', [
            ...Arr::only($def, ['title', 'desc', 'icon', 'add', 'filters', 'columns']),
            'form' => $edit ? $def['form'] : [],
            'stats' => $def['stats']($items, $ctx),
            'rows' => $items->map(fn ($m) => $def['row']($m, $ctx) + ['id' => $m->getKey()])->values(),
            'edit' => $edit,
            'imporInfo' => in_array($resource, \App\Http\Controllers\ImporController::JENIS[$r->user()->role] ?? []) ? \App\Support\Impor::info($resource, $r->user()) : null,
            'role' => $r->user()->role,
            'slug' => $resource,
        ]);
    }

    public function store(Request $r, string $resource)
    {
        $def = $this->def($r, $resource);
        abort_unless($def['add'], 403);
        $data = $r->validate($def['rules'](null), $def['messages'] ?? []);
        $model = DB::transaction(fn () => $def['save']($data, null));
        Akademik::catat($r->user(), 'add_circle', "Menambahkan {$def['noun']}: ".($data['judul'] ?? $data['name'] ?? $data['nama'] ?? str($data['pertanyaan'] ?? '')->limit(60)));

        return isset($def['redirect'])
            ? redirect($def['redirect']($model))->with('ok', "{$def['noun']} berhasil dibuat.")
            : back()->with('ok', "{$def['noun']} berhasil disimpan.");
    }

    public function update(Request $r, string $resource, int $id)
    {
        $def = $this->def($r, $resource);
        abort_unless($def['edit'] ?? true, 403);
        $model = $def['query']()->findOrFail($id); // query sudah dibatasi per peran
        $data = $r->validate($def['rules']($model), $def['messages'] ?? []);
        DB::transaction(fn () => $def['save']($data, $model));

        return back()->with('ok', "{$def['noun']} berhasil diperbarui.");
    }

    public function destroy(Request $r, string $resource, int $id)
    {
        $def = $this->def($r, $resource);
        abort_unless($def['edit'] ?? true, 403);
        $model = $def['query']()->findOrFail($id);
        abort_if($model->is($r->user()), 422, 'Tidak dapat menghapus akun sendiri.');
        if (isset($def['hapus'])) $def['hapus']($model);
        $model->delete();

        return back()->with('ok', "{$def['noun']} berhasil dihapus.");
    }
}
