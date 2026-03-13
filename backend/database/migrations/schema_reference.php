<?php
// =============================================================================
// DATABASE SCHEMA — IT Support Management System
// Run: php artisan migrate --seed
// =============================================================================
// NOTE: In a real Laravel project each migration is a separate file.
// These are combined here for clarity. Split into individual files as shown.
// =============================================================================

// ── FILE: database/migrations/2024_01_01_000001_create_clients_table.php ─────
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// CLIENTS — organisations / companies being serviced
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('name');                          // Organisation name
    $table->string('slug')->unique();                // URL-friendly name
    $table->string('contact_person')->nullable();
    $table->string('contact_email')->nullable();
    $table->string('contact_phone')->nullable();
    $table->string('address')->nullable();
    $table->string('contract_number')->nullable();
    $table->string('po_number')->nullable();
    $table->enum('status', ['active', 'inactive'])->default('active');
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000002_create_users_table.php ────────────────────────────
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete(); // null = staff
    $table->string('name');
    $table->string('email')->unique();
    $table->string('phone')->nullable();
    $table->string('employee_number')->nullable();
    $table->string('designation')->nullable();
    $table->string('password');
    $table->enum('role', ['super_admin', 'manager', 'technician', 'client'])->default('client');
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_login_at')->nullable();
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000003_create_personal_access_tokens_table.php ──────────
Schema::create('personal_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->morphs('tokenable');
    $table->string('name');
    $table->string('token', 64)->unique();
    $table->text('abilities')->nullable();
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});

// ── FILE: 2024_01_01_000004_create_sites_table.php ────────────────────────────
Schema::create('sites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->string('name');                          // e.g. "Main Campus", "Branch Office"
    $table->string('building')->nullable();
    $table->string('address')->nullable();
    $table->string('city')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// ── FILE: 2024_01_01_000005_create_departments_table.php ──────────────────────
Schema::create('departments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->string('name');                          // School, HR, Clinic, etc.
    $table->string('color', 7)->default('#2E75B6'); // Hex color for UI
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->unique(['client_id', 'name']);
});

// ── FILE: 2024_01_01_000006_create_equipment_types_table.php ──────────────────
Schema::create('equipment_types', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete(); // null = global
    $table->string('name');                          // Desktop, Laptop, CCTV, etc.
    $table->string('category')->default('general'); // network, cctv, computer, printer, other
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// ── FILE: 2024_01_01_000007_create_site_visits_table.php ──────────────────────
Schema::create('site_visits', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('lead_technician_id')->constrained('users')->restrictOnDelete();
    $table->string('visit_reference')->unique();     // e.g. VIS-2024-001
    $table->date('visit_date');
    $table->time('time_in')->nullable();
    $table->time('time_out')->nullable();
    $table->date('next_visit_date')->nullable();
    $table->string('contract_number')->nullable();
    $table->string('client_representative')->nullable();
    $table->string('client_designation')->nullable();
    $table->text('scope')->nullable();               // JSON array of scope items ticked
    $table->text('summary')->nullable();
    $table->enum('status', ['draft', 'in_progress', 'completed', 'signed'])->default('draft');
    // Signatures
    $table->string('tech_signature_name')->nullable();
    $table->timestamp('tech_signed_at')->nullable();
    $table->string('client_signature_name')->nullable();
    $table->string('client_signature_designation')->nullable();
    $table->timestamp('client_signed_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000008_create_visit_issues_table.php ────────────────────
Schema::create('visit_issues', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_visit_id')->constrained()->cascadeOnDelete();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('equipment_type_id')->nullable()->constrained()->nullOnDelete();
    $table->string('sub_area')->nullable();          // Room/sub-location
    $table->string('equipment_custom')->nullable();  // If not in list
    $table->string('serial_number')->nullable();
    $table->string('asset_tag')->nullable();
    $table->string('network_point_id')->nullable();  // Links to network_points table
    $table->text('issue_description');
    $table->text('root_cause')->nullable();
    $table->text('action_taken')->nullable();
    $table->enum('status', ['resolved', 'in_progress', 'unresolved', 'recurring', 'pending_parts'])
          ->default('in_progress');
    $table->enum('resolved', ['yes', 'no', 'partial'])->default('no');
    $table->decimal('resolution_hours', 5, 2)->nullable();
    $table->string('parts_used')->nullable();
    $table->decimal('parts_cost', 10, 2)->nullable();
    $table->text('further_request')->nullable();
    $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
    $table->date('followup_date')->nullable();
    $table->text('remarks')->nullable();
    $table->timestamps();
});

// ── FILE: 2024_01_01_000009_create_network_points_table.php ──────────────────
Schema::create('network_points', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_visit_id')->constrained()->cascadeOnDelete();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->string('point_id');                      // e.g. AP-01, SW-A2 — used for autofill
    $table->string('office_room')->nullable();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->string('device_type')->nullable();       // AP, Router, Switch, etc.
    $table->string('connected_to')->nullable();      // Which switch/AP it connects to
    $table->string('switch_port')->nullable();       // Port number / VLAN
    $table->enum('port_status', ['active', 'dead', 'intermittent', 'not_patched', 'disabled', 'reterminate'])
          ->default('active');
    $table->string('speed_mbps')->nullable();
    $table->string('device_connected')->nullable();  // What device is plugged in
    $table->text('issue')->nullable();
    $table->text('remarks')->nullable();
    $table->string('accompanied_by')->nullable();    // Admin who walked with tech
    $table->timestamps();
});

// ── FILE: 2024_01_01_000010_create_equipment_register_table.php ──────────────
Schema::create('equipment_register', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('equipment_type_id')->nullable()->constrained()->nullOnDelete();
    $table->string('custom_item')->nullable();       // If type = OTHER
    $table->string('location_room')->nullable();
    $table->string('make_model')->nullable();
    $table->string('serial_number')->nullable();
    $table->string('asset_tag')->nullable()->unique();
    $table->enum('condition', ['excellent', 'good', 'fair', 'poor', 'for_repair', 'decommissioned'])
          ->default('good');
    $table->date('purchase_date')->nullable();
    $table->date('warranty_expiry')->nullable();
    $table->string('assigned_to')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000011_create_device_credentials_table.php ──────────────
Schema::create('device_credentials', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('device_category', [
        'router', 'wifi_ap', 'nvr_dvr', 'computer', 'switch', 'server', 'other'
    ]);
    $table->string('device_label');                  // e.g. RTR-01, AP-Finance
    $table->string('make_model')->nullable();
    $table->string('ip_address')->nullable();
    $table->string('mac_address')->nullable();
    $table->string('location')->nullable();
    // WiFi specific
    $table->string('ssid')->nullable();
    $table->string('wifi_band')->nullable();
    $table->string('security_type')->nullable();
    $table->string('vlan')->nullable();
    // NVR/DVR specific
    $table->integer('channels')->nullable();
    $table->integer('active_cameras')->nullable();
    $table->string('remote_view_app')->nullable();
    $table->string('hdd_size')->nullable();
    $table->integer('retention_days')->nullable();
    // Computer specific
    $table->string('hostname')->nullable();
    $table->string('os_version')->nullable();
    $table->string('domain_workgroup')->nullable();
    $table->boolean('remote_desktop')->default(false);
    // Common credentials (AES-256 encrypted)
    $table->text('username')->nullable();            // encrypted
    $table->text('password_masked')->nullable();     // encrypted — masked value
    $table->text('secondary_username')->nullable();  // encrypted (domain/remote)
    $table->text('secondary_password_masked')->nullable(); // encrypted
    $table->text('extra_credentials')->nullable();   // encrypted JSON for anything extra
    $table->string('firmware_version')->nullable();
    $table->date('credentials_last_changed')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000012_create_tickets_table.php ─────────────────────────
Schema::create('tickets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
    $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->string('ticket_number')->unique();       // TKT-2024-0001
    $table->string('title');
    $table->text('description');
    $table->string('equipment')->nullable();
    $table->string('location')->nullable();
    $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
    $table->enum('status', ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'])
          ->default('open');
    $table->text('resolution_notes')->nullable();
    $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// ── FILE: 2024_01_01_000013_create_ticket_comments_table.php ─────────────────
Schema::create('ticket_comments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->restrictOnDelete();
    $table->text('comment');
    $table->boolean('is_internal')->default(false); // internal = not visible to client
    $table->timestamps();
});

// ── FILE: 2024_01_01_000014_create_further_requests_table.php ────────────────
Schema::create('further_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_visit_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
    $table->text('description');
    $table->string('item_required')->nullable();
    $table->string('custom_item')->nullable();
    $table->decimal('estimated_cost', 10, 2)->nullable();
    $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
    $table->string('requested_by')->nullable();
    $table->date('due_date')->nullable();
    $table->enum('progress', ['pending', 'approved', 'in_progress', 'completed', 'rejected'])
          ->default('pending');
    $table->text('notes')->nullable();
    $table->timestamps();
});
