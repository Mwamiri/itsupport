<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\SiteVisitController;
use App\Http\Controllers\Api\VisitIssueController;
use App\Http\Controllers\Api\NetworkPointController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\CredentialController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\FurtherRequestController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;

// ── PUBLIC ────────────────────────────────────────────────────────────────────
Route::post('/login',          [AuthController::class, 'login']);
Route::post('/forgot-password',[AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ── AUTHENTICATED ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/me',      [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── SUPER ADMIN + MANAGER ─────────────────────────────────────────────────
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('clients', ClientController::class);
        Route::apiResource('users',   UserController::class);
        Route::get('/reports/weekly',  [ReportController::class, 'weekly']);
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
        Route::get('/reports/export',  [ReportController::class, 'export']);
    });

    // ── SUPER ADMIN ONLY ──────────────────────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::put('/users/{user}/toggle-active',   [UserController::class, 'toggleActive']);
        // Credentials — full access
        Route::apiResource('credentials', CredentialController::class);
    });

    // ── TECHNICIAN + ADMIN ────────────────────────────────────────────────────
    Route::middleware('role:super_admin,manager,technician')->group(function () {

        // Site visits
        Route::apiResource('site-visits',          SiteVisitController::class);
        Route::post('/site-visits/{visit}/sign',   [SiteVisitController::class, 'sign']);
        Route::get('/site-visits/{visit}/pdf',     [SiteVisitController::class, 'exportPdf']);
        Route::get('/site-visits/{visit}/excel',   [SiteVisitController::class, 'exportExcel']);

        // Issues within a visit
        Route::apiResource('site-visits.issues',   VisitIssueController::class);

        // Network points
        Route::apiResource('site-visits.network-points', NetworkPointController::class);
        Route::get('/network-points/lookup/{point_id}',  [NetworkPointController::class, 'lookup']);

        // Equipment register
        Route::apiResource('equipment',            EquipmentController::class);

        // Further requests
        Route::apiResource('further-requests',     FurtherRequestController::class);

        // Tickets — technicians can view + update all tickets for their clients
        Route::get('/tickets',                     [TicketController::class, 'index']);
        Route::get('/tickets/{ticket}',            [TicketController::class, 'show']);
        Route::put('/tickets/{ticket}',            [TicketController::class, 'update']);
        Route::post('/tickets/{ticket}/assign',    [TicketController::class, 'assign']);
        Route::post('/tickets/{ticket}/comments',  [TicketController::class, 'addComment']);

        // Credentials — technicians can read (not write unless super_admin)
        Route::get('/credentials',                 [CredentialController::class, 'index']);
        Route::get('/credentials/{credential}',    [CredentialController::class, 'show']);
    });

    // ── CLIENT PORTAL ─────────────────────────────────────────────────────────
    Route::middleware('role:client')->group(function () {

        // Client can only see their own data — enforced in controllers via policy
        Route::get('/my/dashboard',         [DashboardController::class, 'clientDashboard']);
        Route::get('/my/visits',            [SiteVisitController::class, 'myVisits']);
        Route::get('/my/visits/{visit}',    [SiteVisitController::class, 'myVisitDetail']);
        Route::get('/my/reports/weekly',    [ReportController::class, 'myWeekly']);
        Route::get('/my/reports/monthly',   [ReportController::class, 'myMonthly']);

        // Submit + track tickets
        Route::get('/my/tickets',           [TicketController::class, 'myTickets']);
        Route::post('/my/tickets',          [TicketController::class, 'store']);
        Route::get('/my/tickets/{ticket}',  [TicketController::class, 'myTicketDetail']);
        Route::post('/my/tickets/{ticket}/comments', [TicketController::class, 'addComment']);

        // View further requests
        Route::get('/my/further-requests',  [FurtherRequestController::class, 'myRequests']);
    });

    // ── SHARED (all authenticated) ────────────────────────────────────────────
    Route::get('/clients/{client}/departments', [DepartmentController::class, 'index']);
    Route::get('/clients/{client}/sites',       [SiteController::class, 'index']);

    // Technician/Admin can manage departments & sites
    Route::middleware('role:super_admin,manager,technician')->group(function () {
        Route::post('/clients/{client}/departments',         [DepartmentController::class, 'store']);
        Route::put('/clients/{client}/departments/{dept}',   [DepartmentController::class, 'update']);
        Route::delete('/clients/{client}/departments/{dept}',[DepartmentController::class, 'destroy']);
        Route::post('/clients/{client}/sites',               [SiteController::class, 'store']);
        Route::put('/clients/{client}/sites/{site}',         [SiteController::class, 'update']);
    });
});
