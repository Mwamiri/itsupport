<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceCredential;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;

class CredentialController extends Controller
{
    /**
     * Only super_admin can write credentials.
     * Technicians can read (masked). Clients have no access.
     */

    public function index(Request $request): JsonResponse
    {
        $query = DeviceCredential::with(['client', 'site', 'department'])
            ->orderBy('device_category')
            ->orderBy('device_label');

        if ($request->client_id)       $query->where('client_id', $request->client_id);
        if ($request->device_category) $query->where('device_category', $request->device_category);
        if ($request->site_id)         $query->where('site_id', $request->site_id);

        $creds = $query->paginate(50);

        // Return masked data for non-super-admin
        $isSuperAdmin = $request->user()->role === 'super_admin';

        $creds->getCollection()->transform(function ($cred) use ($isSuperAdmin) {
            return $this->formatCredential($cred, $isSuperAdmin, reveal: false);
        });

        return response()->json($creds);
    }

    public function show(Request $request, DeviceCredential $credential): JsonResponse
    {
        $isSuperAdmin = $request->user()->role === 'super_admin';
        // Reveal full credentials only to super_admin
        return response()->json(
            $this->formatCredential($credential->load(['client','site','department']),
            $isSuperAdmin, reveal: $isSuperAdmin)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateCredential($request);
        $data = $this->encryptSensitiveFields($data);

        $credential = DeviceCredential::create($data);
        return response()->json(
            $this->formatCredential($credential, true, reveal: true), 201
        );
    }

    public function update(Request $request, DeviceCredential $credential): JsonResponse
    {
        $data = $this->validateCredential($request, partial: true);
        $data = $this->encryptSensitiveFields($data);
        $credential->update($data);

        return response()->json(
            $this->formatCredential($credential->fresh(), true, reveal: true)
        );
    }

    public function destroy(DeviceCredential $credential): JsonResponse
    {
        $credential->delete();
        return response()->json(['message' => 'Credential record deleted.']);
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private function validateCredential(Request $request, bool $partial = false): array
    {
        $rules = [
            'client_id'                    => 'required|exists:clients,id',
            'site_id'                      => 'nullable|exists:sites,id',
            'department_id'                => 'nullable|exists:departments,id',
            'device_category'              => 'required|in:router,wifi_ap,nvr_dvr,computer,switch,server,other',
            'device_label'                 => 'required|string|max:100',
            'make_model'                   => 'nullable|string',
            'ip_address'                   => 'nullable|ip',
            'mac_address'                  => 'nullable|string',
            'location'                     => 'nullable|string',
            'ssid'                         => 'nullable|string',
            'wifi_band'                    => 'nullable|string',
            'security_type'                => 'nullable|string',
            'vlan'                         => 'nullable|string',
            'channels'                     => 'nullable|integer',
            'active_cameras'               => 'nullable|integer',
            'remote_view_app'              => 'nullable|string',
            'hdd_size'                     => 'nullable|string',
            'retention_days'               => 'nullable|integer',
            'hostname'                     => 'nullable|string',
            'os_version'                   => 'nullable|string',
            'domain_workgroup'             => 'nullable|string',
            'remote_desktop'               => 'nullable|boolean',
            'username'                     => 'nullable|string',
            'password_masked'              => 'nullable|string',
            'secondary_username'           => 'nullable|string',
            'secondary_password_masked'    => 'nullable|string',
            'firmware_version'             => 'nullable|string',
            'credentials_last_changed'     => 'nullable|date',
            'notes'                        => 'nullable|string',
        ];

        if ($partial) {
            $rules = array_map(fn($r) => str_replace('required|', 'sometimes|', $r), $rules);
        }

        return $request->validate($rules);
    }

    private function encryptSensitiveFields(array $data): array
    {
        $sensitiveFields = ['username', 'password_masked', 'secondary_username', 'secondary_password_masked'];
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field]) && $data[$field] !== null) {
                $data[$field] = Crypt::encryptString($data[$field]);
            }
        }
        return $data;
    }

    private function formatCredential(DeviceCredential $cred, bool $isSuperAdmin, bool $reveal): array
    {
        $out = $cred->toArray();

        // Decrypt or mask sensitive fields
        $sensitiveFields = ['username', 'password_masked', 'secondary_username', 'secondary_password_masked'];
        foreach ($sensitiveFields as $field) {
            if (empty($out[$field])) continue;
            try {
                $decrypted = Crypt::decryptString($out[$field]);
                if ($reveal && $isSuperAdmin) {
                    $out[$field] = $decrypted;
                } else {
                    // Show masked: first 2 + bullets + last 2
                    $len = strlen($decrypted);
                    $out[$field] = $len > 4
                        ? substr($decrypted, 0, 2) . str_repeat('•', max(4, $len - 4)) . substr($decrypted, -2)
                        : str_repeat('•', $len);
                }
            } catch (\Exception $e) {
                $out[$field] = '••••••••'; // fallback if decrypt fails
            }
        }

        return $out;
    }
}
