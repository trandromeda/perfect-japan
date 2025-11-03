/**
 * Simple test script to verify Supabase database operations
 * Run with: npx tsx test-db.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './lib/database.types';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function testDatabaseOperations() {
  console.log('🧪 Testing Supabase database operations...\n');

  try {
    // Test 1: Create a test trip
    console.log('1️⃣ Creating test trip...');
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: 'Test Trip to Tokyo',
        destination: 'Tokyo, Japan',
        start_date: '2025-11-01',
        end_date: '2025-11-05',
      })
      .select()
      .single();

    if (tripError) throw tripError;
    console.log('   ✅ Trip created:', trip.id);

    // Test 2: Create a test day
    console.log('\n2️⃣ Creating test day...');
    const { data: day, error: dayError } = await supabase
      .from('days')
      .insert({
        trip_id: trip.id,
        day_number: 1,
        date: '2025-11-01',
        summary: 'Arrival in Tokyo',
      })
      .select()
      .single();

    if (dayError) throw dayError;
    console.log('   ✅ Day created:', day.id);

    // Test 3: Create a test activity
    console.log('\n3️⃣ Creating test activity...');
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        trip_id: trip.id,
        day_id: day.id,
        title: 'Visit Senso-ji Temple',
        category: 'see',
        location: 'Asakusa, Tokyo',
        status: 'planned',
        position: 0,
      })
      .select()
      .single();

    if (activityError) throw activityError;
    console.log('   ✅ Activity created:', activity.id);

    // Test 4: Test the get_trip_with_details function
    console.log('\n4️⃣ Testing get_trip_with_details function...');
    const { data: fullTrip, error: rpcError } = await supabase
      .rpc('get_trip_with_details', { trip_uuid: trip.id })
      .single();

    if (rpcError) throw rpcError;
    console.log('   ✅ Retrieved trip with details:');
    console.log('   ', JSON.stringify(fullTrip, null, 2).split('\n').join('\n    '));

    // Test 5: Clean up - delete the test trip (cascade will handle days and activities)
    console.log('\n5️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', trip.id);

    if (deleteError) throw deleteError;
    console.log('   ✅ Test data deleted');

    console.log('\n✨ All database operations completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

testDatabaseOperations();
