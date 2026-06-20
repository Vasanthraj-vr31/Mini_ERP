<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'model_type', 'model_id',
        'action', 'field_changed', 'old_value', 'new_value', 'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function auditable()
    {
        return $this->morphTo('auditable', 'model_type', 'model_id');
    }

    public static function record(
        string $modelType,
        int $modelId,
        string $action,
        string $description = '',
        string $field = null,
        $oldValue = null,
        $newValue = null
    ): void {
        static::create([
            'user_id'       => auth()->id(),
            'model_type'    => $modelType,
            'model_id'      => $modelId,
            'action'        => $action,
            'field_changed' => $field,
            'old_value'     => $oldValue !== null ? (string) $oldValue : null,
            'new_value'     => $newValue !== null ? (string) $newValue : null,
            'description'   => $description,
        ]);
    }
}
