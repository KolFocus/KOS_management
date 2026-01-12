这是update的样例：
const handlers = {
  PUT: async (_req: Request, { params }: { params: { id: string } }) => {
    const id = params.id;

    const exists = await queryPg(`SELECT 1 FROM qiangua_note_product_candidate WHERE "Id" = $1`, [id]);
    if (!exists.length) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    }

    await queryPg(
      `UPDATE qiangua_note_product_candidate
       SET "LinkedProductId" = $1, "UpdatedAt" = now()
       WHERE "Id" = $2`,
      [PRODUCT_LINKING_IGNORE_UUID, id],
    );

    return NextResponse.json({ success: true });
  },
};