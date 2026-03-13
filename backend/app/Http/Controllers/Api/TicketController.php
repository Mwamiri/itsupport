<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['client', 'site', 'department', 'submittedBy', 'assignedTo'])
            ->orderBy('created_at', 'desc');

        if ($request->client_id)   $query->where('client_id', $request->client_id);
        if ($request->status)      $query->where('status', $request->status);
        if ($request->priority)    $query->where('priority', $request->priority);
        if ($request->assigned_to) $query->where('assigned_to', $request->assigned_to);

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'site_id'       => 'nullable|exists:sites,id',
            'department_id' => 'nullable|exists:departments,id',
            'equipment'     => 'nullable|string',
            'location'      => 'nullable|string',
            'priority'      => 'in:critical,high,medium,low',
        ]);

        $data['client_id']     = $user->client_id ?? $request->client_id;
        $data['submitted_by']  = $user->id;
        $data['status']        = 'open';
        $data['ticket_number'] = $this->generateTicketNumber();

        $ticket = Ticket::create($data);
        $ticket->load(['client', 'submittedBy', 'department']);

        return response()->json($ticket, 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorizeTicketAccess($request->user(), $ticket);
        $ticket->load(['client','site','department','submittedBy','assignedTo','comments.user','resolvedBy']);
        return response()->json($ticket);
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'status'           => 'sometimes|in:open,assigned,in_progress,resolved,closed,rejected',
            'priority'         => 'sometimes|in:critical,high,medium,low',
            'resolution_notes' => 'nullable|string',
            'assigned_to'      => 'nullable|exists:users,id',
        ]);

        if (isset($data['status']) && $data['status'] === 'resolved') {
            $data['resolved_by'] = $request->user()->id;
            $data['resolved_at'] = now();
        }

        $ticket->update($data);
        return response()->json($ticket->fresh(['client','assignedTo','resolvedBy']));
    }

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['technician_id' => 'required|exists:users,id']);
        $ticket->update([
            'assigned_to' => $request->technician_id,
            'status'      => 'assigned',
        ]);
        return response()->json(['message' => 'Ticket assigned.', 'ticket' => $ticket->fresh()]);
    }

    public function addComment(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorizeTicketAccess($request->user(), $ticket);

        $data = $request->validate([
            'comment'     => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $comment = TicketComment::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => $request->user()->id,
            'comment'     => $data['comment'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function myTickets(Request $request): JsonResponse
    {
        $tickets = Ticket::with(['site', 'department', 'assignedTo'])
            ->where('client_id', $request->user()->client_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($tickets);
    }

    public function myTicketDetail(Request $request, Ticket $ticket): JsonResponse
    {
        abort_if($ticket->client_id !== $request->user()->client_id, 403);
        $ticket->load(['site','department','assignedTo',
            'comments' => fn($q) => $q->where('is_internal', false)->with('user'),
        ]);
        return response()->json($ticket);
    }

    private function authorizeTicketAccess($user, Ticket $ticket): void
    {
        if ($user->role === 'client') {
            abort_if($ticket->client_id !== $user->client_id, 403);
        }
    }

    private function generateTicketNumber(): string
    {
        $year  = date('Y');
        $count = Ticket::whereYear('created_at', $year)->count() + 1;
        return sprintf('TKT-%s-%04d', $year, $count);
    }
}
