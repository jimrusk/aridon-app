-- Aridon v0.3 — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

-- CRM Leads
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text,
  email text,
  notes text,
  status text default 'new',
  created_at timestamptz default now()
);

-- Projects
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  executive text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  assigned_to text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now()
);

-- Knowledge Vault
create table if not exists knowledge_vault (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text,
  content text,
  created_at timestamptz default now()
);
