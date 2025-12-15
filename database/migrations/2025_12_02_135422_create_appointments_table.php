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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('clinic_id')->constrained()->onDelete('cascade');
            $table->foreignId('treatment_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Odontólogo
            $table->dateTime('datetime_start');
            $table->dateTime('datetime_end');
            $table->enum('status', ['confirmado', 'cancelado', 'asistio', 'no_asistio'])->default('confirmado');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Índice para prevenir solapamientos de turnos del mismo usuario
            $table->index(['user_id', 'datetime_start', 'datetime_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
