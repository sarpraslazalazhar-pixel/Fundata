<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Admin;
use App\Models\Record;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function userIndex()
    {
        return Inertia::render('User/Messages/Index');
    }

    public function adminIndex()
    {
        return Inertia::render('Admin/Messages/Index');
    }

    private function getCurrentType(Request $request = null)
    {
        $requestedType = $request ? ($request->query('sender_type') ?? $request->input('sender_type')) : null;

        if ($requestedType === 'user' && Auth::guard('web')->check()) {
            return User::class;
        }
        if ($requestedType === 'admin' && Auth::guard('admin')->check()) {
            return Admin::class;
        }

        if (Auth::guard('admin')->check()) {
            return Admin::class;
        }
        return User::class;
    }

    private function getCurrentUser(Request $request = null)
    {
        $type = $this->getCurrentType($request);
        if ($type === Admin::class) {
            return Auth::guard('admin')->user();
        }
        return Auth::guard('web')->user();
    }

    public function contacts(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        $currentType = $this->getCurrentType($request);

        // Get Users
        $users = User::when($currentType === User::class, function($q) use ($currentUser) {
            return $q->where('id', '!=', $currentUser->id);
        })->get(['id', 'name', 'username', 'avatar_path'])->map(function($user) {
            $user->type = 'user';
            $user->model_type = User::class;
            // Provide a fallback name if name is null
            if (empty($user->name)) {
                $user->name = $user->username ?: 'Unknown User';
            }
            return $user;
        });

        // Get Admins
        $admins = Admin::when($currentType === Admin::class, function($q) use ($currentUser) {
            return $q->where('id', '!=', $currentUser->id);
        })->get(['id', 'name', 'username', 'avatar_path'])->map(function($admin) {
            $admin->type = 'admin';
            $admin->model_type = Admin::class;
            // The getNameAttribute in Admin will work correctly now since we selected username
            return $admin;
        });

        $contacts = $admins->concat($users);
        return response()->json($contacts->values());
    }

    public function fetchMessages(Request $request, $receiverId)
    {
        $receiverType = $request->query('receiver_type');
        if (!$receiverType) {
            return response()->json([]);
        }

        $senderType = $this->getCurrentType($request);
        $senderId = $this->getCurrentUser($request)->id;

        $conversation = Conversation::where(function ($query) use ($senderId, $senderType, $receiverId, $receiverType) {
            $query->where('participant_one_type', $senderType)
                  ->where('participant_one_id', $senderId)
                  ->where('participant_two_type', $receiverType)
                  ->where('participant_two_id', $receiverId);
        })->orWhere(function ($query) use ($senderId, $senderType, $receiverId, $receiverType) {
            $query->where('participant_one_type', $receiverType)
                  ->where('participant_one_id', $receiverId)
                  ->where('participant_two_type', $senderType)
                  ->where('participant_two_id', $senderId);
        })->first();

        if (!$conversation) {
            return response()->json([]);
        }

        $messages = $conversation->messages()->with('context')->get();
        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|integer',
            'receiver_type' => 'required|string',
            'body' => 'required_without:attachment_base64|string|nullable',
            'context_type' => 'nullable|string',
            'context_id' => 'nullable|integer',
            'attachment_base64' => 'nullable|string',
            'attachment_name' => 'nullable|string',
        ]);

        $senderType = $this->getCurrentType($request);
        $senderId = $this->getCurrentUser($request)->id;
        $receiverType = $request->receiver_type;
        $receiverId = $request->receiver_id;

        $conversation = Conversation::where(function ($query) use ($senderId, $senderType, $receiverId, $receiverType) {
            $query->where('participant_one_type', $senderType)
                  ->where('participant_one_id', $senderId)
                  ->where('participant_two_type', $receiverType)
                  ->where('participant_two_id', $receiverId);
        })->orWhere(function ($query) use ($senderId, $senderType, $receiverId, $receiverType) {
            $query->where('participant_one_type', $receiverType)
                  ->where('participant_one_id', $receiverId)
                  ->where('participant_two_type', $senderType)
                  ->where('participant_two_id', $senderId);
        })->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'participant_one_type' => $senderType,
                'participant_one_id' => $senderId,
                'participant_two_type' => $receiverType,
                'participant_two_id' => $receiverId,
            ]);
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentType = null;
        $attachmentSize = null;

        if ($request->filled('attachment_base64')) {
            $base64 = $request->attachment_base64;
            // Format: data:image/png;base64,iVBORw0KGgo...
            if (preg_match('/^data:(\w+\/[\w\-+.]+);base64,(.+)$/i', $base64, $matches)) {
                $attachmentType = $matches[1];
                $fileData = base64_decode($matches[2]);
                
                if ($fileData !== false) {
                    $attachmentSize = strlen($fileData);
                    // Validasi max 3MB = 3 * 1024 * 1024
                    if ($attachmentSize > 3145728) {
                        return response()->json(['error' => 'File melebihi batas 3MB.'], 422);
                    }

                    $attachmentName = $request->attachment_name ?: 'attachment_' . time();
                    $extension = explode('/', $attachmentType)[1] ?? 'bin';
                    
                    // Jika nama file tidak punya ekstensi yang sesuai
                    if (!preg_match('/\.[a-zA-Z0-9]+$/', $attachmentName)) {
                        $attachmentName .= '.' . $extension;
                    }

                    $fileName = uniqid() . '_' . time() . '.' . $extension;
                    \Illuminate\Support\Facades\Storage::disk('public')->put('chat_attachments/' . $fileName, $fileData);
                    $attachmentPath = 'chat_attachments/' . $fileName;
                }
            }
        }

        $message = $conversation->messages()->create([
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'body' => $request->body ?? '',
            'context_type' => $request->context_type,
            'context_id' => $request->context_id,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_type' => $attachmentType,
            'attachment_size' => $attachmentSize,
        ]);

        $message->load('context');

        // Broadcast to receiver
        broadcast(new MessageSent($message, clone $conversation))->toOthers();

        // Web push notification
        $receiverModel = $receiverType === User::class ? User::find($receiverId) : Admin::find($receiverId);
        if ($receiverModel) {
            $senderName = $this->getCurrentUser($request)->name ?? 'Pengguna';
            $receiverModel->notify(new \App\Notifications\NewMessageNotification($message, $senderName));
        }

        return response()->json($message);
    }

    public function contextOptions(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        $currentType = $this->getCurrentType($request);

        $query = Record::with('subUnit')->orderBy('created_at', 'desc')->limit(50);

        if ($currentType === User::class) {
            $query->where('user_id', $currentUser->id);
        }

        $records = $query->get(['id', 'sub_unit_id', 'form_data', 'created_at']);
        
        $options = $records->map(function($record) {
            return [
                'id' => $record->id,
                'title' => $record->judul ?? 'Tiket #' . $record->id,
                'model_type' => Record::class,
                'created_at' => $record->created_at,
            ];
        });

        return response()->json($options);
    }
}
