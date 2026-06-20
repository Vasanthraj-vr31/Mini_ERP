<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bom_operations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bom_id');
            $table->string('operation_name');
            $table->unsignedBigInteger('work_center_id')->nullable();
            $table->integer('expected_duration_mins')->default(0);
            $table->integer('sequence')->default(0);
            $table->timestamps();

            $table->foreign('bom_id')->references('id')->on('bills_of_materials')->cascadeOnDelete();
            $table->foreign('work_center_id')->references('id')->on('work_centers')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('bom_operations');
    }
};
