<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bom_components', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bom_id');
            $table->unsignedBigInteger('component_id');
            $table->decimal('to_consume_qty', 12, 3);
            $table->string('uom', 50)->default('pcs');
            $table->timestamps();

            $table->foreign('bom_id')->references('id')->on('bills_of_materials')->cascadeOnDelete();
            $table->foreign('component_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bom_components');
    }
};
