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

        // Fetch all conversations for current user
        $conversations = Conversation::where(function ($query) use ($currentUser, $currentType) {
            $query->where('participant_one_type', $currentType)
                  ->where('participant_one_id', $currentUser->id);
        })->orWhere(function ($query) use ($currentUser, $currentType) {
            $query->where('participant_two_type', $currentType)
                  ->where('participant_two_id', $currentUser->id);
        })->with('lastMessage')
        ->withCount(['messages as unread_count' => function ($query) use ($currentUser, $currentType) {
            $query->where('is_read', false)
                  ->where(function ($q) use ($currentUser, $currentType) {
                      $q->where('sender_type', '!=', $currentType)
                        ->orWhere('sender_id', '!=', $currentUser->id);
                  });
        }])->get();

        $convMap = [];
        foreach ($conversations as $conv) {
            $isOne = ($conv->participant_one_type === $currentType && $conv->participant_one_id == $currentUser->id);
            $otherType = $isOne ? $conv->participant_two_type : $conv->participant_one_type;
            $otherId = $isOne ? $conv->participant_two_id : $conv->participant_one_id;

            $key = $otherType . ':' . $otherId;
            $lastMsg = $conv->lastMessage;
            $unreadCount = $conv->unread_count;

            $convMap[$key] = [
                'last_message' => $lastMsg ? ($lastMsg->body ?: ($lastMsg->attachment_path ? '[Lampiran]' : '')) : '',
                'last_message_at' => $lastMsg ? $lastMsg->created_at->toISOString() : null,
                'unread_count' => (int) $unreadCount,
            ];
        }

        // Filter active users based on conversations
        $activeUserIds = [];
        $activeAdminIds = [];
        foreach ($conversations as $conv) {
            $isOne = ($conv->participant_one_type === $currentType && $conv->participant_one_id == $currentUser->id);
            $otherType = $isOne ? $conv->participant_two_type : $conv->participant_one_type;
            $otherId = $isOne ? $conv->participant_two_id : $conv->participant_one_id;

            if ($otherType === User::class) {
                $activeUserIds[] = $otherId;
            } elseif ($otherType === Admin::class) {
                $activeAdminIds[] = $otherId;
            }
        }

        // Jika yang login adalah User biasa, dia TIDAK BOLEH melihat User lain di kontaknya (hanya bisa chat ke Admin)
        if ($currentType === User::class) {
            $users = collect([]);
        } else {
            // Jika yang login adalah Admin, HANYA muat user yang sudah ada percakapan (menghindari lambat jika user ribuan)
            $users = User::whereIn('id', $activeUserIds)->get(['id', 'name', 'username', 'avatar_path'])->map(function($user) {
                $user->type = 'user';
                $user->model_type = User::class;
                if (empty($user->name)) {
                    $user->name = $user->username ?: 'Unknown User';
                }
                return $user;
            });
        }

        // Get Admins (Selalu tampilkan semua admin karena jumlahnya sedikit)
        $admins = Admin::when($currentType === Admin::class, function($q) use ($currentUser) {
            return $q->where('id', '!=', $currentUser->id);
        })->get(['id', 'name', 'username', 'avatar_path'])->map(function($admin) {
            $admin->type = 'admin';
            $admin->model_type = Admin::class;
            return $admin;
        });

        $contacts = $admins->concat($users)->map(function($contact) use ($convMap) {
            $key = $contact->model_type . ':' . $contact->id;
            $info = $convMap[$key] ?? [
                'last_message' => '',
                'last_message_at' => null,
                'unread_count' => 0,
            ];
            $contact->last_message = $info['last_message'];
            $contact->last_message_at = $info['last_message_at'];
            $contact->unread_count = $info['unread_count'];
            return $contact;
        });

        // Sort by last_message_at desc
        $sortedContacts = $contacts->sortByDesc(function($c) {
            return $c->last_message_at ?? '1970-01-01T00:00:00.000Z';
        });

        return response()->json($sortedContacts->values());
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

        // Auto mark as read when fetching messages
        $updatedCount = $conversation->messages()
            ->where('sender_type', $receiverType)
            ->where('sender_id', $receiverId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        if ($updatedCount > 0) {
            broadcast(new \App\Events\MessagesRead($senderId, $senderType, $receiverId, $receiverType))->toOthers();
        }

        $messages = $conversation->messages()->with('context')->get();
        return response()->json($messages);
    }

    public function markAsRead(Request $request, $receiverId)
    {
        $receiverType = $request->input('receiver_type') ?? $request->query('receiver_type');
        if (!$receiverType) {
            return response()->json(['success' => false]);
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

        if ($conversation) {
            $updatedCount = $conversation->messages()
                ->where('sender_type', $receiverType)
                ->where('sender_id', $receiverId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            if ($updatedCount > 0) {
                broadcast(new \App\Events\MessagesRead($senderId, $senderType, $receiverId, $receiverType))->toOthers();
            }
        }

        return response()->json(['success' => true]);
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

        $message->load(['context', 'sender']);

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

        $receiverId = $request->query('receiver_id') ?? $request->input('receiver_id');
        $receiverType = $request->query('receiver_type') ?? $request->input('receiver_type');

        $query = Record::with(['unit', 'subUnit.unit', 'donatur'])->orderBy('created_at', 'desc')->limit(50);

        if ($currentType === User::class) {
            $query->where('user_id', $currentUser->id);
        } else if ($receiverType === User::class || $receiverType === 'App\\Models\\User' || $receiverType === 'user') {
            if ($receiverId) {
                $query->where('user_id', $receiverId);
            }
        }

        $records = $query->get();
        
        $options = $records->map(function($record) {
            $ticketNumber = 'Tiket #' . $record->formatted_id;
            $donaturName = $record->donatur_nama;
            $unitName = $record->unit_nama;
            $subUnitName = $record->sub_unit_nama;
            
            $displayTitle = $donaturName 
                ? $ticketNumber . ' - ' . $donaturName 
                : $ticketNumber . ' - ' . ($record->judul ?? 'Pengajuan');

            return [
                'id' => $record->id,
                'ticket_number' => $ticketNumber,
                'donatur_name' => $donaturName,
                'unit_name' => $unitName,
                'sub_unit_name' => $subUnitName,
                'title' => $displayTitle,
                'model_type' => Record::class,
                'created_at' => $record->created_at,
            ];
        });

        return response()->json($options);
    }
}
