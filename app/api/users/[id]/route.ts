import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing user id" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("profiles")
    .update({
      full_name: body.full_name,
      role: body.role,
      status: body.status,
    })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0]);
}

// DELETE user
// export async function DELETE(
//   req: Request,
//  { params }: { params: { id: string } }
// ) {
//   const id = params?.id;

//   console.log("API DELETE IDDD:", id);

//   if (!id) {
//     return NextResponse.json(
//       { error: "Missing user id" },
//       { status: 400 }
//     );
//   }

//   const { error } = await supabaseServer
//     .from("profiles")
//     .delete()
//     .eq("id", id);

//   if (error) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json({ success: true });
// }
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("API DELETE ID:", id);

  if (!id) {
    return NextResponse.json(
      { error: "Missing user id" },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}