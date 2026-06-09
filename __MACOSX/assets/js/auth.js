// Substitua pelas credenciais do seu painel do Supabase
const SUPABASE_URL = "https://kdciiafpksfellfaojtv.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_RaySXBAFILjPNPCPtkeaNA_cb8HMoSN"

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email-address').value;
    const password = document.getElementById('password').value;

    // Autenticação direta no Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Erro ao fazer login: " + error.message);
    } else {
        alert("Login efetuado com sucesso!");
        window.location.href = "index.html"; // Redireciona para a home
    }
});