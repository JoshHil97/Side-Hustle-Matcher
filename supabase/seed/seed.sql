-- Sample seed for one-user scenario.
-- This script intentionally seeds only if at least one auth user exists.
-- Create a user first in Supabase Studio Auth, then run `supabase db reset --local`.

do $$
declare
  v_user_id uuid;
  v_company_1 uuid := gen_random_uuid();
  v_company_2 uuid := gen_random_uuid();
  v_company_3 uuid := gen_random_uuid();

  v_app_1 uuid := gen_random_uuid();
  v_app_2 uuid := gen_random_uuid();
  v_app_3 uuid := gen_random_uuid();

  v_contact_1 uuid := gen_random_uuid();
  v_contact_2 uuid := gen_random_uuid();

  v_template_1 uuid := gen_random_uuid();
  v_template_2 uuid := gen_random_uuid();
begin
  select id into v_user_id
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise notice 'Seed skipped: no auth.users row found.';
    return;
  end if;

  insert into public.profiles (id, full_name)
  values (v_user_id, 'Sample Candidate')
  on conflict (id) do update
  set full_name = excluded.full_name;

  insert into public.companies (id, user_id, name, website_url, location, industry, notes)
  values
    (
      v_company_1,
      v_user_id,
      'Northstar Financial',
      'https://northstar.example.com',
      'London, UK',
      'FinTech',
      '{"general":"Scale-up, product-led culture","values":"Ownership, bias for action","interview_process":"Recruiter screen -> HM -> panel","salary_notes":"Market median + bonus","tech_stack_notes":"TypeScript, Node, PostgreSQL"}'
    ),
    (
      v_company_2,
      v_user_id,
      'Meridian Health',
      'https://meridian.example.com',
      'Manchester, UK',
      'HealthTech',
      '{"general":"Mission-driven healthcare platform","values":"Patient-first","interview_process":"Recruiter -> technical task -> final","salary_notes":"NHS-aligned range","tech_stack_notes":"React, Python, AWS"}'
    ),
    (
      v_company_3,
      v_user_id,
      'Atlas Commerce',
      'https://atlas.example.com',
      'Remote',
      'E-commerce',
      '{"general":"Global retail infra","values":"Customer obsession","interview_process":"Async exercise + pair interview","salary_notes":"Equity heavy","tech_stack_notes":"Next.js, Go, Kafka"}'
    )
  on conflict (user_id, name) do nothing;

  insert into public.applications (
    id,
    user_id,
    company_id,
    company_name,
    role_title,
    job_url,
    location,
    work_mode,
    salary_min,
    salary_max,
    currency,
    date_posted,
    date_applied,
    source,
    priority,
    status,
    next_step_date,
    next_step_note,
    description_snapshot,
    fit_score
  )
  values
    (
      v_app_1,
      v_user_id,
      v_company_1,
      'Northstar Financial',
      'Product Analyst',
      'https://northstar.example.com/jobs/product-analyst',
      'London, UK',
      'hybrid',
      50000,
      65000,
      'GBP',
      current_date - 12,
      current_date - 8,
      'LinkedIn',
      'high',
      'screening',
      current_date + 2,
      'Prepare recruiter discussion points',
      'Role focuses on experimentation, KPI ownership, and stakeholder communication.',
      84
    ),
    (
      v_app_2,
      v_user_id,
      v_company_2,
      'Meridian Health',
      'Operations Analyst',
      'https://meridian.example.com/careers/ops-analyst',
      'Manchester, UK',
      'onsite',
      42000,
      52000,
      'GBP',
      current_date - 20,
      current_date - 14,
      'Company site',
      'medium',
      'applied',
      null,
      null,
      'Cross-functional operations with healthcare process optimization.',
      76
    ),
    (
      v_app_3,
      v_user_id,
      v_company_3,
      'Atlas Commerce',
      'Business Analyst',
      'https://atlas.example.com/careers/business-analyst',
      'Remote',
      'remote',
      55000,
      70000,
      'GBP',
      current_date - 6,
      current_date - 3,
      'Referral',
      'high',
      'interview_1',
      current_date + 4,
      'Review case study prep notes',
      'Commercial insights and forecasting focus.',
      89
    )
  on conflict (id) do nothing;

  insert into public.contacts (id, user_id, company_id, name, email, role, linkedin_url, notes)
  values
    (
      v_contact_1,
      v_user_id,
      v_company_1,
      'Sarah Patel',
      'sarah.patel@northstar.example.com',
      'Talent Partner',
      'https://linkedin.com/in/sarah-patel',
      'Primary recruiter contact'
    ),
    (
      v_contact_2,
      v_user_id,
      v_company_3,
      'Michael Reed',
      'm.reed@atlas.example.com',
      'Hiring Manager',
      'https://linkedin.com/in/michael-reed',
      'Interview loop owner'
    )
  on conflict (id) do nothing;

  insert into public.application_contacts (user_id, application_id, contact_id, relationship)
  values
    (v_user_id, v_app_1, v_contact_1, 'recruiter'),
    (v_user_id, v_app_3, v_contact_2, 'hiring_manager')
  on conflict (application_id, contact_id) do nothing;

  insert into public.notes (user_id, application_id, kind, content)
  values
    (v_user_id, v_app_1, 'general', 'Strong mission fit. Emphasize prior analytics ownership examples.'),
    (v_user_id, v_app_1, 'interview_prep', 'Prepare STAR examples for ambiguous stakeholder requests.'),
    (v_user_id, v_app_3, 'follow_up', 'Send thank-you email with summary of case approach.'),
    (v_user_id, v_app_3, 'company_research', 'Atlas expanding in DACH. Team org recently restructured.')
  on conflict (id) do nothing;

  insert into public.status_history (user_id, application_id, from_status, to_status, occurred_at, note)
  values
    (v_user_id, v_app_1, 'applied', 'screening', now() - interval '2 days', 'Recruiter reached out for screening call'),
    (v_user_id, v_app_3, 'applied', 'interview_1', now() - interval '1 day', 'First interview booked')
  on conflict (id) do nothing;

  insert into public.documents (
    user_id,
    application_id,
    company_id,
    storage_bucket,
    storage_path,
    file_name,
    file_type,
    file_size,
    category,
    version_label
  )
  values
    (
      v_user_id,
      v_app_1,
      v_company_1,
      'documents',
      v_user_id::text || '/' || v_app_1::text || '/sample_cv_v3.pdf',
      'sample_cv_v3.pdf',
      'application/pdf',
      182000,
      'cv',
      'CV v3'
    ),
    (
      v_user_id,
      v_app_1,
      v_company_1,
      'documents',
      v_user_id::text || '/' || v_app_1::text || '/sample_cover_letter_fintech.pdf',
      'sample_cover_letter_fintech.pdf',
      'application/pdf',
      94000,
      'cover_letter',
      'Cover Letter FinTech'
    )
  on conflict (id) do nothing;

  insert into public.templates (id, user_id, title, type, tags, content)
  values
    (
      v_template_1,
      v_user_id,
      'Follow-up after interview',
      'follow_up_email',
      array['follow-up', 'interview'],
      'Hi {{name}}, thank you for the conversation today. I enjoyed discussing {{topic}} and would love to continue in the process.'
    ),
    (
      v_template_2,
      v_user_id,
      'CV bullet: impact-driven',
      'cv_bullet',
      array['cv', 'impact'],
      'Led weekly reporting automation that reduced manual analysis time by 35% and improved decision cycle speed.'
    )
  on conflict (id) do nothing;

  insert into public.reminders (user_id, application_id, title, due_at, status, channel)
  values
    (v_user_id, v_app_1, 'Prepare screening highlights', now() + interval '1 day', 'open', 'in_app'),
    (v_user_id, v_app_2, 'Follow up after application', now() + interval '2 days', 'open', 'in_app')
  on conflict (id) do nothing;

  raise notice 'Seed complete for user %', v_user_id;
end
$$;
