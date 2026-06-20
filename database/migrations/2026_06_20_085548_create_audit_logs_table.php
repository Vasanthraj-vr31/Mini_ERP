<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->string('action');          // created, updated, status_changed, etc.
            $table->string('field_changed')->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['model_type', 'model_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};
