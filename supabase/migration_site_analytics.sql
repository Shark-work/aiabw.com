-- Site-wide page view counter (stored in site_settings)

insert into public.site_settings (key, value) values
  ('total_page_views', '0'),
  ('last_page_view_at', '')
on conflict (key) do nothing;
