WITH namespaces AS (
  SELECT oid, nspname FROM pg_namespace
  WHERE nspname IN ('core', 'enki_runtime') OR nspname LIKE 'workspace_%'
), entries AS (
  SELECT 'table' AS kind, n.nspname AS namespace, c.relname AS relation,
    jsonb_build_object('rls', c.relrowsecurity, 'forceRls', c.relforcerowsecurity) AS definition
  FROM pg_class c JOIN namespaces n ON n.oid = c.relnamespace WHERE c.relkind = 'r'
  UNION ALL
  SELECT 'column', n.nspname, c.relname,
    jsonb_build_object('name', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
      'notNull', a.attnotnull, 'generated', a.attgenerated, 'identity', a.attidentity,
      'default', pg_get_expr(d.adbin, d.adrelid))
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
  JOIN namespaces n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'constraint', n.nspname, c.relname,
    jsonb_build_object('type', con.contype, 'definition', pg_get_constraintdef(con.oid),
      'validated', con.convalidated, 'deferred', con.condeferred)
  FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
  JOIN namespaces n ON n.oid = c.relnamespace
  WHERE con.contype <> 'n'
  UNION ALL
  SELECT 'index', n.nspname, t.relname,
    jsonb_build_object('definition', regexp_replace(pg_get_indexdef(i.indexrelid), '^CREATE (UNIQUE )?INDEX [^ ]+ ON ', 'CREATE \1INDEX ON '),
      'valid', i.indisvalid)
  FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid JOIN namespaces n ON n.oid = t.relnamespace
  UNION ALL
  SELECT 'enum', n.nspname, t.typname,
    jsonb_build_object('labels', jsonb_agg(e.enumlabel ORDER BY e.enumsortorder))
  FROM pg_type t JOIN namespaces n ON n.oid = t.typnamespace JOIN pg_enum e ON e.enumtypid = t.oid
  GROUP BY n.nspname, t.typname
)
SELECT coalesce(jsonb_agg(to_jsonb(entries) ORDER BY kind, namespace, relation, definition::text), '[]'::jsonb) AS catalog
FROM entries;
