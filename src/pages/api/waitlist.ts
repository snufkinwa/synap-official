import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store'
		}
	});

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		console.error('Supabase environment variables are missing.');
		return jsonResponse({ error: 'Server not configured' }, 500);
	}

	const formData = await request.formData();
	const emailValue = formData.get('email');
	const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailPattern.test(email)) {
		return jsonResponse({ error: 'Valid email is required.' }, 400);
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: { persistSession: false }
	});

	const { error } = await supabase.from('waitlist').insert({ email });

	if (error) {
		// 23505 = unique_violation (email already stored)
		if ((error as { code?: string }).code === '23505') {
			return jsonResponse({ ok: true, message: 'Already on the waitlist.' }, 200);
		}

		console.error('Supabase waitlist insert error:', error);
		return jsonResponse({ error: 'Unable to save email right now.' }, 500);
	}

	return jsonResponse({ ok: true }, 201);
};

export const GET: APIRoute = async () => jsonResponse({ error: 'Method not allowed' }, 405);
