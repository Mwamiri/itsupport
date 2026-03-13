<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteVisit;
use App\Models\VisitIssue;
use App\Models\Ticket;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function weekly(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'week'      => 'nullable|integer|min:1|max:53',
            'year'      => 'nullable|integer|min:2020|max:2099',
        ]);

        $year  = $request->year  ?? date('Y');
        $week  = $request->week  ?? date('W');

        $startOfWeek = Carbon::now()->setISODate($year, $week)->startOfWeek();
        $endOfWeek   = $startOfWeek->copy()->endOfWeek();

        return response()->json($this->buildReport($request->client_id, $startOfWeek, $endOfWeek, 'weekly', $week, $year));
    }

    public function monthly(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'month'     => 'nullable|integer|min:1|max:12',
            'year'      => 'nullable|integer|min:2020|max:2099',
        ]);

        $year  = $request->year  ?? date('Y');
        $month = $request->month ?? date('n');

        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth   = $startOfMonth->copy()->endOfMonth();

        return response()->json($this->buildReport($request->client_id, $startOfMonth, $endOfMonth, 'monthly', $month, $year));
    }

    public function myWeekly(Request $request): JsonResponse
    {
        $request->merge(['client_id' => $request->user()->client_id]);
        return $this->weekly($request);
    }

    public function myMonthly(Request $request): JsonResponse
    {
        $request->merge(['client_id' => $request->user()->client_id]);
        return $this->monthly($request);
    }

    public function export(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $type = $request->type ?? 'monthly';
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ReportExport($request->all()),
            "it-support-report-{$type}-" . date('Y-m-d') . '.xlsx'
        );
    }

    // ── PRIVATE ───────────────────────────────────────────────────────────────

    private function buildReport(?int $clientId, Carbon $from, Carbon $to, string $period, int $periodNum, int $year): array
    {
        $issueQuery = VisitIssue::whereBetween('created_at', [$from, $to]);
        $visitQuery = SiteVisit::whereBetween('visit_date', [$from, $to]);
        $ticketQuery = Ticket::whereBetween('created_at', [$from, $to]);

        if ($clientId) {
            $issueQuery->where('client_id', $clientId);
            $visitQuery->where('client_id', $clientId);
            $ticketQuery->where('client_id', $clientId);
        }

        // KPI Summary
        $totalIssues    = (clone $issueQuery)->count();
        $resolved       = (clone $issueQuery)->where('resolved', 'yes')->count();
        $unresolved     = (clone $issueQuery)->where('resolved', 'no')->count();
        $inProgress     = (clone $issueQuery)->where('status', 'in_progress')->count();
        $critical       = (clone $issueQuery)->where('priority', 'critical')->count();
        $totalPartsCost = (clone $issueQuery)->sum('parts_cost');
        $avgResolution  = (clone $issueQuery)->whereNotNull('resolution_hours')->avg('resolution_hours');
        $totalVisits    = (clone $visitQuery)->count();
        $openTickets    = (clone $ticketQuery)->whereIn('status', ['open','assigned','in_progress'])->count();
        $closedTickets  = (clone $ticketQuery)->whereIn('status', ['resolved','closed'])->count();

        // Department breakdown
        $byDepartment = (clone $issueQuery)
            ->join('departments', 'visit_issues.department_id', '=', 'departments.id')
            ->select(
                'departments.name as department',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN visit_issues.resolved = 'yes' THEN 1 ELSE 0 END) as resolved"),
                DB::raw("SUM(CASE WHEN visit_issues.resolved = 'no' THEN 1 ELSE 0 END) as unresolved"),
                DB::raw("SUM(CASE WHEN visit_issues.priority = 'critical' THEN 1 ELSE 0 END) as critical"),
                DB::raw('SUM(COALESCE(visit_issues.parts_cost, 0)) as parts_cost'),
                DB::raw('COUNT(CASE WHEN visit_issues.further_request IS NOT NULL THEN 1 END) as further_requests')
            )
            ->groupBy('departments.id', 'departments.name')
            ->orderBy('total', 'desc')
            ->get();

        // Issues by priority
        $byPriority = (clone $issueQuery)
            ->select('priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priority')
            ->get()
            ->pluck('count', 'priority');

        // Issues by equipment type
        $byEquipment = (clone $issueQuery)
            ->join('equipment_types', 'visit_issues.equipment_type_id', '=', 'equipment_types.id')
            ->select('equipment_types.name as equipment', DB::raw('COUNT(*) as count'))
            ->groupBy('equipment_types.id', 'equipment_types.name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        // Recent visits
        $recentVisits = (clone $visitQuery)
            ->with(['client', 'site', 'leadTechnician'])
            ->orderBy('visit_date', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($v) => [
                'reference'  => $v->visit_reference,
                'client'     => $v->client->name,
                'site'       => $v->site?->name,
                'date'       => $v->visit_date,
                'technician' => $v->leadTechnician->name,
                'status'     => $v->status,
            ]);

        return [
            'period'      => $period,
            'period_num'  => $periodNum,
            'year'        => $year,
            'date_from'   => $from->toDateString(),
            'date_to'     => $to->toDateString(),
            'client_id'   => $clientId,
            'kpis' => [
                'total_issues'    => $totalIssues,
                'resolved'        => $resolved,
                'unresolved'      => $unresolved,
                'in_progress'     => $inProgress,
                'critical'        => $critical,
                'total_parts_cost'=> round($totalPartsCost, 2),
                'avg_resolution_hrs' => $avgResolution ? round($avgResolution, 1) : null,
                'total_visits'    => $totalVisits,
                'open_tickets'    => $openTickets,
                'closed_tickets'  => $closedTickets,
                'resolution_rate' => $totalIssues > 0 ? round(($resolved / $totalIssues) * 100, 1) : 0,
            ],
            'by_department' => $byDepartment,
            'by_priority'   => $byPriority,
            'by_equipment'  => $byEquipment,
            'recent_visits' => $recentVisits,
        ];
    }
}
