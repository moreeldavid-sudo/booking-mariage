// ...
const [name, setName] = useState('');
const [email, setEmail] = useState('');       // <-- nouveau
const [quantity, setQuantity] = useState(1);
// ...
<form onSubmit={submit} className="space-y-4">
  <div>
    <label className="block text-sm font-medium">Nom & prénom</label>
    <input required /* ... */ value={name} onChange={e=>setName(e.target.value)} />
  </div>
  <div>
    <label className="block text-sm font-medium">Email</label>
    <input
      type="email"
      placeholder="ex. jeanne@exemple.com"
      required                                        // <-- obligatoire
      className="mt-1 w-full rounded-xl border p-3"
      value={email}
      onChange={(e)=>setEmail(e.target.value)}
    />
  </div>
  <div>/* quantité */</div>
  {/* erreurs + boutons */}
</form>
