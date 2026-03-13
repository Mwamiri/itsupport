<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteVisit;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SiteVisitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SiteVisit::with(['client', 'site', 'leadTechnician', 'issues'])
            ->orderBy('visit_date', 'desc');

        // Scope by client for technicians
        if ($request->user()->role === 'technician') {
            // Can see all visits — scoped by client if specified
        }

        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->site_id) {
            $query->where('site_id', $request->site_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->where('visit_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('visit_date', '<=', $request->date_to);
        }

        $visits = $query->paginate($request->per_page ?? 20);

        return response()->json($visits);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'               => 'required|exists:clients,id',
            'site_id'                 => 'nullable|exists:sites,id',
            'visit_date'              => 'required|date',
            'time_in'                 => 'nullable|date_format:H:i',
            'time_out'                => 'nullable|date_format:H:i',
            'next_visit_date'         => 'nullable|date',
            'contract_number'         => 'nullable|string',
            'client_representative'   => 'nullable|string',
            'client_designation'      => 'nullable|string',
            'scope'                   => 'nullable|array',
            'summary'                 => 'nullable|string',
        ]);

        $data['lead_technician_id'] = $request->user()->id;
        $data['visit_reference']    = $this->generateReference();
        $data['status']             = 'draft';

        $visit = SiteVisit::create($data);
        $visit->load(['client', 'site', 'leadTechnician']);

        return response()->json($visit, 201);
    }

    public function show(Request $request, SiteVisit $siteVisit): JsonResponse
    {
        $siteVisit->load([
            'client', 'site', 'leadTechnician',
            'issues.department', 'issues.equipmentType',
            'networkPoints.department',
            'furtherRequests.department',
        ]);

        return response()->json($siteVisit);
    }

    public function update(Request $request, SiteVisit $siteVisit): JsonResponse
    {
        $this->authorize('update', $siteVisit);

        $data = $request->validate([
            'site_id'               => 'nullable|exists:sites,id',
            'visit_date'            => 'sometimes|date',
            'time_in'               => 'nullable|date_format:H:i',
            'time_out'              => 'nullable|date_format:H:i',
            'next_visit_date'       => 'nullable|date',
            'contract_number'       => 'nullable|string',
            'client_representative' => 'nullable|string',
            'client_designation'    => 'nullable|string',
            'scope'                 => 'nullable|array',
            'summary'               => 'nullable|string',
            'status'                => 'sometimes|in:draft,in_progress,completed,signed',
        ]);

        $siteVisit->update($data);
        return response()->json($siteVisit->fresh(['client', 'site', 'leadTechnician']));
    }

    public function destroy(SiteVisit $siteVisit): JsonResponse
    {
        $this->authorize('delete', $siteVisit);
        $siteVisit->delete();
        return response()->json(['message' => 'Visit deleted.']);
    }

    /**
     * Record technician or client sign-off
     */
    public function sign(Request $request, SiteVisit $siteVisit): JsonResponse
    {
        $data = $request->validate([
            'signer_type'  => 'required|in:technician,client',
            'signer_name'  => 'required|string',
            'designation'  => 'nullable|string',
        ]);

        if ($data['signer_type'] === 'technician') {
            $siteVisit->update([
                'tech_signature_name' => $data['signer_name'],
                'tech_signed_at'      => now(),
            ]);
        } else {
            $siteVisit->update([
                'client_signature_name'        => $data['signer_name'],
                'client_signature_designation' => $data['designation'] ?? null,
                'client_signed_at'             => now(),
                'status'                       => 'signed',
            ]);
        }

        return response()->json([
            'message' => 'Signature recorded.',
            'visit'   => $siteVisit->fresh(),
        ]);
    }

    /**
     * Client-facing: own visits only
     */
    public function myVisits(Request $request): JsonResponse
    {
        $visits = SiteVisit::with(['site', 'leadTechnician'])
            ->where('client_id', $request->user()->client_id)
            ->where('status', '!=', 'draft')
            ->orderBy('visit_date', 'desc')
            ->paginate(20);

        return response()->json($visits);
    }

    public function myVisitDetail(Request $request, SiteVisit $siteVisit): JsonResponse
    {
        abort_if($siteVisit->client_id !== $request->user()->client_id, 403);

        $siteVisit->load([
            'site', 'leadTechnician',
            'issues.department', 'networkPoints',
            'furtherRequests',
        ]);

        return response()->json($siteVisit);
    }

    public function exportPdf(SiteVisit $siteVisit): \Illuminate\Http\Response
    {
        // Requires barryvdh/laravel-dompdf
        $siteVisit->load(['client', 'site', 'leadTechnician', 'issues.department', 'networkPoints']);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.site-visit', compact('siteVisit'));
        return $pdf->download("visit-report-{$siteVisit->visit_reference}.pdf");
    }

    public function exportExcel(SiteVisit $siteVisit): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        // Requires maatwebsite/excel
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\SiteVisitExport($siteVisit),
            "visit-{$siteVisit->visit_reference}.xlsx"
        );
    }

    private function generateReference(): string
    {
        $year  = date('Y');
        $count = SiteVisit::whereYear('created_at', $year)->count() + 1;
        return sprintf('VIS-%s-%04d', $year, $count);
    }
}
