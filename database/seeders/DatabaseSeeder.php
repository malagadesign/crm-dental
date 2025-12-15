<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear usuario administrador
        User::create([
            'name' => 'Odontólogo',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        // Crear las 2 clínicas
        Clinic::create([
            'name' => 'Consultorio A',
            'address' => 'Av. Principal 123',
            'phone' => '+54 11 1234-5678',
            'email' => 'consultorioa@example.com',
        ]);

        Clinic::create([
            'name' => 'Consultorio B',
            'address' => 'Calle Secundaria 456',
            'phone' => '+54 11 9876-5432',
            'email' => 'consultoriob@example.com',
        ]);

        // Cargar tratamientos dentales
        $this->call([
            TreatmentSeeder::class,
        ]);
    }
}
