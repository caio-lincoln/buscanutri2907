// Script para verificar tabelas no Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Verificar tabela consultation_ratings
    console.log('Verificando tabela consultation_ratings...');
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('consultation_ratings')
      .select('id')
      .limit(1);

    if (ratingsError) {
      console.error('Erro ao verificar tabela consultation_ratings:', ratingsError);
    } else {
      console.log('Tabela consultation_ratings existe:', ratingsData !== null);
    }

    // Verificar tabela consultation_reviews
    console.log('\nVerificando tabela consultation_reviews...');
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('consultation_reviews')
      .select('id')
      .limit(1);

    if (reviewsError) {
      console.error('Erro ao verificar tabela consultation_reviews:', reviewsError);
    } else {
      console.log('Tabela consultation_reviews existe:', reviewsData !== null);
    }

  } catch (err) {
    console.error('Erro geral:', err);
  }
}

checkTables();