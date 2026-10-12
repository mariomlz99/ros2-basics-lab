export const sessionScope=index=>index===8?'free':index===7?'playground':'course';

// Read older two-workspace sessions and the current collection without nesting
// live workspaces inside one another or sharing mutable filesystem snapshots.
export function savedSlots(record){
 const slots=new Map(Object.entries(record?.slots??{}));
 if(record?.other)slots.set(sessionScope(record.other.ui.lessonIndex??record.other.ui.unitIndex),record.other);
 slots.delete(sessionScope(record?.ui.lessonIndex??record?.ui.unitIndex));
 return slots;
}
