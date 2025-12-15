<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('origin', ['instagram', 'google', 'facebook', 'recomendacion', 'otro'])->default('instagram');
            $table->text('message')->nullable();
            $table->enum('status', ['nuevo', 'contactado', 'convertido', 'descartado'])->default('nuevo');
            $table->foreignId('patient_id')->nullable()->constrained()->onDelete('set null'); // Si se convierte en paciente
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
