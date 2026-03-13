<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Client;
use App\Models\Site;
use App\Models\Department;
use App\Models\EquipmentType;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── DEFAULT CLIENTS ───────────────────────────────────────────────────
        $client1 = Client::create([
            'name'            => 'St. Mary\'s Mission Complex',
            'slug'            => 'st-marys',
            'contact_person'  => 'Fr. Emmanuel Odhiambo',
            'contact_email'   => 'admin@stmarys.org',
            'contact_phone'   => '+254 700 000001',
            'address'         => 'P.O. Box 100, Kisumu, Kenya',
            'contract_number' => 'CON-2024-001',
            'status'          => 'active',
        ]);

        $client2 = Client::create([
            'name'           => 'Greenfield Academy',
            'slug'           => 'greenfield',
            'contact_person' => 'Mrs. Jane Kamau',
            'contact_email'  => 'admin@greenfield.ac.ke',
            'contact_phone'  => '+254 700 000002',
            'status'         => 'active',
        ]);

        // ── SITES ─────────────────────────────────────────────────────────────
        $site1 = Site::create(['client_id' => $client1->id, 'name' => 'Main Campus', 'building' => 'Block A']);
        $site2 = Site::create(['client_id' => $client1->id, 'name' => 'Clinic Wing', 'building' => 'Block B']);
        $site3 = Site::create(['client_id' => $client2->id, 'name' => 'Main School', 'building' => 'Main Block']);

        // ── DEPARTMENTS — CLIENT 1 ────────────────────────────────────────────
        $depts1 = [
            ['name' => 'School',          'color' => '#2E75B6'],
            ['name' => 'Homes',           'color' => '#70AD47'],
            ['name' => 'Education',       'color' => '#ED7D31'],
            ['name' => 'Finance',         'color' => '#FFC000'],
            ['name' => 'Procurement',     'color' => '#7030A0'],
            ['name' => 'Farm & Business', 'color' => '#1ABC9C'],
            ['name' => 'Clinic',          'color' => '#E74C3C'],
            ['name' => 'HR',              'color' => '#8E44AD'],
            ['name' => 'Church',          'color' => '#D4AC0D'],
            ['name' => 'Admin',           'color' => '#1F3864'],
            ['name' => 'Teams & Guests',  'color' => '#117A65'],
            ['name' => 'Central Kitchen', 'color' => '#CA6F1E'],
        ];
        foreach ($depts1 as $d) {
            Department::create(array_merge($d, ['client_id' => $client1->id]));
        }

        // ── DEPARTMENTS — CLIENT 2 ────────────────────────────────────────────
        $depts2 = [
            ['name' => 'Administration', 'color' => '#2E75B6'],
            ['name' => 'Library',        'color' => '#70AD47'],
            ['name' => 'Science Lab',    'color' => '#ED7D31'],
            ['name' => 'Sports',         'color' => '#E74C3C'],
            ['name' => 'Accounts',       'color' => '#7030A0'],
        ];
        foreach ($depts2 as $d) {
            Department::create(array_merge($d, ['client_id' => $client2->id]));
        }

        // ── GLOBAL EQUIPMENT TYPES ────────────────────────────────────────────
        $equipmentTypes = [
            ['name' => 'Desktop Computer',      'category' => 'computer'],
            ['name' => 'Laptop',                'category' => 'computer'],
            ['name' => 'Server',                'category' => 'computer'],
            ['name' => 'CCTV Camera',           'category' => 'cctv'],
            ['name' => 'NVR',                   'category' => 'cctv'],
            ['name' => 'DVR',                   'category' => 'cctv'],
            ['name' => 'Printer',               'category' => 'printer'],
            ['name' => 'Photocopier',           'category' => 'printer'],
            ['name' => 'Scanner',               'category' => 'printer'],
            ['name' => 'Access Point',          'category' => 'network'],
            ['name' => 'Network Switch',        'category' => 'network'],
            ['name' => 'Router',                'category' => 'network'],
            ['name' => 'UPS / Power Backup',    'category' => 'network'],
            ['name' => 'Monitor',               'category' => 'computer'],
            ['name' => 'Keyboard & Mouse',      'category' => 'computer'],
            ['name' => 'Projector',             'category' => 'other'],
            ['name' => 'Smart TV',              'category' => 'other'],
            ['name' => 'IP Phone',              'category' => 'network'],
            ['name' => 'Tablet',                'category' => 'computer'],
            ['name' => 'External Hard Drive',   'category' => 'other'],
            ['name' => 'OTHER (specify)',        'category' => 'other'],
        ];
        foreach ($equipmentTypes as $et) {
            EquipmentType::create($et); // client_id = null = global
        }

        // ── USERS ─────────────────────────────────────────────────────────────
        User::create([
            'name'            => 'System Administrator',
            'email'           => 'admin@itsupport.local',
            'password'        => Hash::make('password'),
            'role'            => 'super_admin',
            'employee_number' => 'EMP-001',
            'designation'     => 'System Administrator',
            'is_active'       => true,
        ]);

        User::create([
            'name'            => 'Operations Manager',
            'email'           => 'manager@itsupport.local',
            'password'        => Hash::make('password'),
            'role'            => 'manager',
            'employee_number' => 'EMP-002',
            'designation'     => 'IT Manager',
            'is_active'       => true,
        ]);

        User::create([
            'name'            => 'John Otieno',
            'email'           => 'tech@itsupport.local',
            'password'        => Hash::make('password'),
            'role'            => 'technician',
            'employee_number' => 'EMP-003',
            'designation'     => 'IT Technician',
            'is_active'       => true,
        ]);

        User::create([
            'name'            => 'Fr. Emmanuel Odhiambo',
            'email'           => 'client@itsupport.local',
            'password'        => Hash::make('password'),
            'role'            => 'client',
            'client_id'       => $client1->id,
            'designation'     => 'Mission Director',
            'is_active'       => true,
        ]);

        User::create([
            'name'            => 'Mrs. Jane Kamau',
            'email'           => 'client2@itsupport.local',
            'password'        => Hash::make('password'),
            'role'            => 'client',
            'client_id'       => $client2->id,
            'designation'     => 'School Principal',
            'is_active'       => true,
        ]);

        $this->command->info('✅ Database seeded successfully!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super Admin', 'admin@itsupport.local',    'password'],
                ['Manager',     'manager@itsupport.local',  'password'],
                ['Technician',  'tech@itsupport.local',     'password'],
                ['Client 1',    'client@itsupport.local',   'password'],
                ['Client 2',    'client2@itsupport.local',  'password'],
            ]
        );
    }
}
