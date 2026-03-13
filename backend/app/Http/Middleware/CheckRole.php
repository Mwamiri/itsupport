<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Usage in routes: middleware('role:super_admin,manager')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'You do not have permission to access this resource.',
                'your_role' => $user->role,
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
