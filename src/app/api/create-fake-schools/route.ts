import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const WALLET_ADDRESSES = [
  'rweachc46DLM9S5avhfubKT2p9Xt3S6cEd', // Fake School 1
  'rLbmFWAe6JDCaZ2Zffe1Wjn9weSwhJiXsb', // Fake School 2
  'rwQBkAke9HScNzAe1qoe6cY3nETZCkCEP5', // Fake School 3
];

const POSSIBLE_SCHOOL_PREFIXES = ['Global', 'International', 'United', 'Academic', 'Progressive', 'Community', 'Greenwood', 'Riverdale', 'Mountainview', 'Lakeside', 'Sunrise', 'Ocean', 'Desert', 'Forest', 'City'];
const POSSIBLE_SCHOOL_MAINS = ['Tech', 'Arts', 'Science', 'Humanities', 'Business', 'Medical', 'Engineering', 'Music', 'Sports', 'Culinary'];
const POSSIBLE_SCHOOL_SUFFIXES = ['Academy', 'Institute', 'School', 'College', 'University', 'Center', 'High', 'Preparatory', 'Polytechnic', 'Seminary'];
const POSSIBLE_DOMAINS = ['edu', 'org', 'school', 'ac.uk', 'edu.au', 'edu.ca', 'ac.jp', 'sch.id'];
const POSSIBLE_COUNTRIES = [
  'USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Singapore', 
  'New Zealand', 'South Africa', 'Brazil', 'India', 'China', 'South Korea', 'Mexico'
];
const POSSIBLE_CITIES = [
    'New York', 'Toronto', 'London', 'Sydney', 'Berlin', 'Paris', 'Tokyo', 'Singapore City',
    'Auckland', 'Cape Town', 'Sao Paulo', 'Mumbai', 'Shanghai', 'Seoul', 'Mexico City',
    'Los Angeles', 'Vancouver', 'Manchester', 'Melbourne', 'Munich', 'Lyon', 'Osaka',
    'Wellington', 'Johannesburg', 'Rio de Janeiro', 'Delhi', 'Beijing', 'Busan', 'Guadalajara'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomSchoolName(): string {
  // Construct a more varied name
  const nameParts = [];
  nameParts.push(getRandomElement(POSSIBLE_SCHOOL_PREFIXES));
  if (Math.random() > 0.3) { // 70% chance to add a main part
    nameParts.push(getRandomElement(POSSIBLE_SCHOOL_MAINS));
  }
  nameParts.push(getRandomElement(POSSIBLE_SCHOOL_SUFFIXES));
  return `${nameParts.join(' ')} #${Math.floor(Math.random() * 1000)}`;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars but keep hyphens
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/#+/g, '');      // Remove # characters
}

export async function GET() {
  if (process.env.ENABLE_CREATE_FAKE_SCHOOLS_API !== 'true') {
    return NextResponse.json(
      { message: 'Create Fake Schools API is disabled. Set ENABLE_CREATE_FAKE_SCHOOLS_API=true in .env.local to enable.' },
      { status: 403 } // Forbidden
    );
  }

  const schoolsToInsert = [];
  const createdSchoolNames = new Set<string>();

  for (const walletAddress of WALLET_ADDRESSES) {
    let schoolName = generateRandomSchoolName();
    // Ensure unique school names if generating multiple for the same wallet or in general
    while(createdSchoolNames.has(schoolName)) {
        schoolName = generateRandomSchoolName(); // Regenerate if name already used in this batch
    }
    createdSchoolNames.add(schoolName);

    const nameSlug = slugify(schoolName);
    const country = getRandomElement(POSSIBLE_COUNTRIES);
    const city = getRandomElement(POSSIBLE_CITIES);
    const domainSuffix = getRandomElement(POSSIBLE_DOMAINS);
    // Ensure the domain slug is clean for URL and DID
    const cleanNameSlugForDomain = nameSlug.replace(/[^a-z0-9-]/ig, '');
    const domain = `${cleanNameSlugForDomain}.${domainSuffix}`;

    const schoolData = {
      name: schoolName,
      contact_email: `info@${domain}`,
      website_url: `https://${domain}`,
      country: country,
      did: `did:web:${domain}`, // Example DID using did:web method
      wallet_address: walletAddress,
      description: `Welcome to ${schoolName}, located in the vibrant city of ${city}, ${country}. We are a premier institution dedicated to excellence in ${getRandomElement(POSSIBLE_SCHOOL_MAINS).toLowerCase()}. Our DID is ${domain} and we proudly accept donations to our XRPL wallet: ${walletAddress}.`,
      is_verified: Math.random() < 0.6, // 60% chance of being verified
      // created_at will be set by Supabase by default
    };
    schoolsToInsert.push(schoolData);
  }

  try {
    // Check if schools with these wallet addresses already exist to avoid duplicates
    const existingWallets = schoolsToInsert.map(s => s.wallet_address);
    const { data: existingSchools, error: fetchError } = await supabase
      .from('schools')
      .select('wallet_address')
      .in('wallet_address', existingWallets);

    if (fetchError) {
      console.error('Error fetching existing schools:', fetchError);
      return NextResponse.json({ message: 'Error checking for existing schools', error: fetchError.message }, { status: 500 });
    }

    const existingWalletSet = new Set(existingSchools.map(s => s.wallet_address));
    const newSchoolsToInsert = schoolsToInsert.filter(s => !existingWalletSet.has(s.wallet_address));

    if (newSchoolsToInsert.length === 0) {
      return NextResponse.json({ message: 'All provided school wallet addresses already exist in the database. No new schools created.', existing_wallets: Array.from(existingWalletSet) }, { status: 200 });
    }

    const { data, error: insertError } = await supabase.from('schools').insert(newSchoolsToInsert).select();

    if (insertError) {
      console.error('Error inserting fake schools into Supabase:', insertError);
      return NextResponse.json({ message: 'Error inserting fake schools', error: insertError.message, details: insertError.details }, { status: 500 });
    }

    const numCreated = data ? data.length : 0;
    const numSkipped = schoolsToInsert.length - numCreated;
    let responseMessage = `${numCreated} fake schools created successfully.`;
    if (numSkipped > 0) {
        responseMessage += ` ${numSkipped} schools were skipped as their wallet addresses already exist.`;
    }

    return NextResponse.json({ message: responseMessage, schools_created: data, num_created: numCreated, num_skipped: numSkipped }, { status: 201 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Unexpected server error:', e);
    return NextResponse.json({ message: 'An unexpected server error occurred', error: errorMessage }, { status: 500 });
  }
}