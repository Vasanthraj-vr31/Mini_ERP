<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mo_work_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('manufacturing_order_id');
            $table->string('operation_name');
            $table->unsignedBigInteger('work_center_id')->nullable();
            $table->integer('expected_duration_mins')->default(0);
            $table->integer('real_duration_mins')->default(0);
            $table->enum('status', ['Pending', 'In-Progress', 'Done'])->default('Pending');
            $table->integer('sequence')->default(0);
            $table->timestamps();

            $table->foreign('manufacturing_order_id')->references('id')->on('manufacturing_orders')->cascadeOnDelete();
            $table->foreign('work_center_id')->references('id')->on('work_centers')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mo_work_orders');
    }
};
