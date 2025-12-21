CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: decrease_goal_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrease_goal_progress() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Decrease count for all active goals
  UPDATE public.goals
  SET current_count = GREATEST(0, current_count - 1)
  WHERE is_completed = false 
    AND end_date > NOW();
  
  RETURN OLD;
END;
$$;


--
-- Name: update_custom_quotes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_custom_quotes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_goal_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_goal_progress() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  goal_record RECORD;
BEGIN
  -- Update all active goals (not completed and not expired)
  FOR goal_record IN 
    SELECT id, current_count, target_count, reward_points
    FROM public.goals
    WHERE is_completed = false 
      AND end_date > NOW()
  LOOP
    -- Increment the goal's current count
    UPDATE public.goals
    SET current_count = current_count + 1,
        is_completed = CASE 
          WHEN (current_count + 1) >= target_count THEN true 
          ELSE false 
        END,
        completed_at = CASE 
          WHEN (current_count + 1) >= target_count THEN NOW() 
          ELSE completed_at 
        END
    WHERE id = goal_record.id;
    
    -- If goal just got completed, award points to user
    IF (goal_record.current_count + 1) >= goal_record.target_count THEN
      UPDATE public.user_profile
      SET total_points = total_points + goal_record.reward_points;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    requirement integer NOT NULL,
    points integer DEFAULT 100 NOT NULL
);


--
-- Name: ai_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    analysis_text text NOT NULL,
    habits_count integer DEFAULT 0 NOT NULL,
    completion_rate numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: custom_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text NOT NULL,
    author text NOT NULL,
    category text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_quotes_category_check CHECK ((category = ANY (ARRAY['success'::text, 'persistence'::text, 'growth'::text, 'strength'::text, 'action'::text])))
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    goal_type text NOT NULL,
    target_count integer NOT NULL,
    current_count integer DEFAULT 0 NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    reward_points integer DEFAULT 50 NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT goals_goal_type_check CHECK ((goal_type = ANY (ARRAY['weekly'::text, 'monthly'::text])))
);


--
-- Name: habit_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    habit_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- Name: habits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    color text DEFAULT '#8B5CF6'::text NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    preferred_time text,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_enabled boolean DEFAULT false,
    reminder_time text
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_name text DEFAULT 'משתמש'::text NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL
);


--
-- Name: wake_up_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wake_up_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wake_date date NOT NULL,
    woke_up boolean DEFAULT true NOT NULL,
    target_time time without time zone DEFAULT '06:00:00'::time without time zone NOT NULL,
    actual_time time without time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: ai_analyses ai_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analyses
    ADD CONSTRAINT ai_analyses_pkey PRIMARY KEY (id);


--
-- Name: custom_quotes custom_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_quotes
    ADD CONSTRAINT custom_quotes_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: habit_completions habit_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_profile user_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (id);


--
-- Name: wake_up_logs wake_up_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wake_up_logs
    ADD CONSTRAINT wake_up_logs_pkey PRIMARY KEY (id);


--
-- Name: wake_up_logs wake_up_logs_wake_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wake_up_logs
    ADD CONSTRAINT wake_up_logs_wake_date_key UNIQUE (wake_date);


--
-- Name: idx_goals_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_end_date ON public.goals USING btree (end_date);


--
-- Name: idx_goals_is_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_is_completed ON public.goals USING btree (is_completed);


--
-- Name: habit_completions trigger_decrease_goal_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_decrease_goal_progress AFTER DELETE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION public.decrease_goal_progress();


--
-- Name: habit_completions trigger_update_goal_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_goal_progress AFTER INSERT ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION public.update_goal_progress();


--
-- Name: custom_quotes update_custom_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_quotes_updated_at BEFORE UPDATE ON public.custom_quotes FOR EACH ROW EXECUTE FUNCTION public.update_custom_quotes_updated_at();


--
-- Name: habit_completions habit_completions_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: achievements Allow all on achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on achievements" ON public.achievements USING (true) WITH CHECK (true);


--
-- Name: ai_analyses Allow all on ai_analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on ai_analyses" ON public.ai_analyses USING (true) WITH CHECK (true);


--
-- Name: custom_quotes Allow all on custom_quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on custom_quotes" ON public.custom_quotes USING (true) WITH CHECK (true);


--
-- Name: goals Allow all on goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on goals" ON public.goals USING (true) WITH CHECK (true);


--
-- Name: habit_completions Allow all on habit_completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on habit_completions" ON public.habit_completions USING (true) WITH CHECK (true);


--
-- Name: habits Allow all on habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on habits" ON public.habits USING (true) WITH CHECK (true);


--
-- Name: user_achievements Allow all on user_achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on user_achievements" ON public.user_achievements USING (true) WITH CHECK (true);


--
-- Name: user_profile Allow all on user_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on user_profile" ON public.user_profile USING (true) WITH CHECK (true);


--
-- Name: wake_up_logs Allow all on wake_up_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all on wake_up_logs" ON public.wake_up_logs USING (true) WITH CHECK (true);


--
-- Name: achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: habits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

--
-- Name: user_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: wake_up_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wake_up_logs ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;