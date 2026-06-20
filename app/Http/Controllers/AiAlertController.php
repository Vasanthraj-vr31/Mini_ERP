<?php

namespace App\Http\Controllers;

use App\Models\AiAlert;
use App\Models\AuditLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class AiAlertController extends Controller
{
    public function index(Request $request)
    {
        $query = AiAlert::with('product');

        if ($request->filled('alert_type')) {
            $query->where('alert_type', $request->alert_type);
        }
        if ($request->filled('is_resolved')) {
            $query->where('is_resolved', (bool)$request->is_resolved);
        } else {
            $query->where('is_resolved', false);
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $alerts      = $query->latest()->paginate(20)->withQueryString();
        $alertTypes  = AiAlert::select('alert_type')->distinct()->pluck('alert_type');
        $products    = Product::orderBy('name')->pluck('name', 'id');

        return view('ai-alerts.index', compact('alerts', 'alertTypes', 'products'));
    }

    public function resolve(AiAlert $aiAlert)
    {
        $aiAlert->update([
            'is_resolved' => true,
            'resolved_at' => now(),
        ]);

        AuditLog::record('AiAlert', $aiAlert->id, 'resolved',
            "Alert '{$aiAlert->alert_type}' resolved for product ID {$aiAlert->product_id}");

        return back()->with('success', 'Alert resolved.');
    }

    public function runForecast()
    {
        Artisan::call('erp:run-forecast');
        $output = Artisan::output();

        return back()->with('success', 'Forecast run complete. ' . trim($output));
    }
}
