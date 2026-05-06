import { useState, useEffect, FormEvent } from 'react';
import { db, auth, handleFirestoreError, ADMIN_EMAIL } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, runTransaction } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ScholasticBlockchain } from '../lib/blockchain';
import { Student, Project, ParticipationRecord, Block } from '../types';
import { motion } from 'motion/react';
import { Plus, Users, Briefcase, Zap, Loader2, AlertCircle, Shield } from 'lucide-react';

export default function AdminPanel() {
  const [user] = useAuthState(auth);
  const [students, setStudents] = useState<Student[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingRecords, setPendingRecords] = useState<ParticipationRecord[]>([]);
  const [isMining, setIsMining] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'projects' | 'mine'>('mine');

  // Form states
  const [newStudent, setNewStudent] = useState({ name: '', grade: '', id: '' });
  const [newProject, setNewProject] = useState({ name: '', type: 'Project' as const, description: '', id: '' });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [achievement, setAchievement] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL && user?.emailVerified === true;

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const sSnap = await getDocs(collection(db, 'students'));
      const pSnap = await getDocs(collection(db, 'projects'));
      setStudents(sSnap.docs.map(d => d.data() as Student));
      setProjects(pSnap.docs.map(d => d.data() as Project));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.id) return;
    try {
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
      setNewStudent({ name: '', grade: '', id: '' });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, 'write', 'students');
    }
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.id) return;
    try {
      const projectData = { ...newProject, date: new Date().toISOString() };
      await setDoc(doc(db, 'projects', newProject.id), projectData);
      setNewProject({ name: '', type: 'Project', description: '', id: '' });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, 'write', 'projects');
    }
  };

  const mineRecord = async (record: ParticipationRecord) => {
    setIsMining(true);
    try {
      await runTransaction(db, async (tx) => {
        const metaRef = doc(db, 'meta', 'chain');
        const metaSnap = await tx.get(metaRef);

        let lastBlock: Block;
        let writeGenesis = false;

        if (!metaSnap.exists()) {
          lastBlock = ScholasticBlockchain.createGenesisBlock();
          writeGenesis = true;
        } else {
          const meta = metaSnap.data() as { lastIndex: number; lastHash: string };
          const lastSnap = await tx.get(doc(db, 'blocks', String(meta.lastIndex)));
          if (!lastSnap.exists()) {
            throw new Error('Zincir meta verisi tutarsız: son blok bulunamadı');
          }
          lastBlock = lastSnap.data() as Block;
          if (lastBlock.hash !== meta.lastHash) {
            throw new Error('Zincir meta verisi tutarsız: hash uyuşmuyor');
          }
        }

        const nextBlock = ScholasticBlockchain.generateNextBlock(lastBlock, [record]);

        if (writeGenesis) {
          tx.set(doc(db, 'blocks', String(lastBlock.index)), lastBlock);
        }
        tx.set(doc(db, 'blocks', String(nextBlock.index)), nextBlock);
        tx.set(metaRef, { lastIndex: nextBlock.index, lastHash: nextBlock.hash });
      });
      setAchievement('');
    } catch (err) {
      handleFirestoreError(err, 'write', 'blocks');
    } finally {
      setIsMining(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-12 bg-white border-8 border-black text-center space-y-6 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-24 h-24 bg-red-500 text-white border-4 border-black flex items-center justify-center mx-auto">
          <AlertCircle size={48} />
        </div>
        <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Erişim Reddedildi</h2>
            <p className="text-lg font-bold opacity-60">PROTOKOL MODİFİKASYONU İÇİN YÖNETİCİ YETKİSİ GEREKLİDİR.</p>
        </div>
        <div className="pt-4">
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-black text-white font-black uppercase tracking-widest border-2 border-black hover:bg-emerald-500 transition-colors">
                YETKİYİ SENKRONİZE ET
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex border-b-4 border-black p-1 w-full md:w-fit">
        {([['mine', 'kaz'], ['students', 'öğrenciler'], ['projects', 'projeler']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 md:flex-none px-8 py-3 font-black text-xs uppercase tracking-[0.2em] transition-all border-r-4 last:border-r-0 border-black ${
              activeTab === tab 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'mine' && (
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8"
            >
              <div className="flex items-center gap-6 border-b-2 border-black pb-6">
                <div className="w-16 h-16 bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Zincir Madenciliği</h3>
                  <p className="text-sm font-bold opacity-40">YENİ AKADEMİK İŞLEMLERİ DEFTERE İŞLE</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Hedef Öğrenci</label>
                  <select 
                    value={selectedStudent} 
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full bg-white border-4 border-black p-4 font-bold text-sm focus:bg-yellow-50 outline-none"
                  >
                    <option value="">Öğrenci Seçin...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Hedef Proje</label>
                  <select 
                    value={selectedProject} 
                    onChange={e => setSelectedProject(e.target.value)}
                    className="w-full bg-white border-4 border-black p-4 font-bold text-sm focus:bg-yellow-50 outline-none"
                  >
                    <option value="">Proje Seçin...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Başarı / Açıklama</label>
                <input 
                  type="text" 
                  value={achievement}
                  onChange={e => setAchievement(e.target.value)}
                  placeholder="ÖR: BİRİNCİLİK ÖDÜLÜ // İNOVASYON ÖDÜLÜ"
                  className="w-full bg-white border-4 border-black p-4 font-bold text-sm focus:bg-yellow-50 outline-none placeholder:opacity-30 uppercase"
                />
              </div>

              <button 
                onClick={() => {
                  if (!selectedStudent || !selectedProject) return;
                  const student = students.find(s => s.id === selectedStudent);
                  const project = projects.find(p => p.id === selectedProject);
                  mineRecord({
                    studentId: selectedStudent,
                    studentName: student?.name || '',
                    projectId: selectedProject,
                    projectName: project?.name || '',
                    role: 'Katılımcı',
                    achievement,
                    timestamp: new Date().toISOString()
                  });
                }}
                disabled={isMining || !selectedStudent || !selectedProject}
                className={`w-full py-6 font-black uppercase text-xl italic flex items-center justify-center gap-4 transition-all border-4 ${
                  isMining 
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                    : (!selectedStudent || !selectedProject)
                      ? 'bg-transparent text-gray-600 border-black/10 cursor-not-allowed'
                      : 'bg-emerald-500 text-black border-black hover:bg-emerald-400 active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {isMining ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Özet Hesaplanıyor...
                  </>
                ) : (
                  <>
                    <Zap size={24} />
                    Zincire Ekle (Mine)
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Similar updates for Students and Projects tabs */}
          {activeTab === 'students' && (
            <motion.form 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onSubmit={handleAddStudent} 
                className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6"
            >
              <div className="flex items-center gap-6 border-b-2 border-black pb-6">
                <div className="w-16 h-16 bg-blue-500 text-white border-4 border-black flex items-center justify-center">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Kayıt Defteri</h3>
                  <p className="text-sm font-bold opacity-40">YENİ ÖĞRENCİ KİMLİKLERİNİ YETKİLENDİR</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Öğrenci Adı</label>
                    <input 
                        type="text" 
                        value={newStudent.name}
                        onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                        className="w-full border-4 border-black p-4 font-bold text-sm uppercase"
                        placeholder="Caner Özkan"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Öğrenci Numarası</label>
                    <input 
                        type="text" 
                        value={newStudent.id}
                        onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                        className="w-full border-4 border-black p-4 font-bold text-sm uppercase font-mono"
                        placeholder="STD-X-100"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Sınıf Profili</label>
                <input 
                  type="text" 
                  value={newStudent.grade}
                  onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  className="w-full border-4 border-black p-4 font-bold text-sm uppercase"
                  placeholder="12. Sınıf"
                />
              </div>
              <button type="submit" className="w-full bg-black text-white py-6 font-black uppercase text-xl border-2 border-black hover:bg-emerald-500 transition-colors">
                Kimliği Yetkilendir
              </button>
            </motion.form>
          )}

          {activeTab === 'projects' && (
            <motion.form 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onSubmit={handleAddProject} 
                className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6"
            >
              <div className="flex items-center gap-6 border-b-2 border-black pb-6">
                <div className="w-16 h-16 bg-yellow-400 text-black border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Briefcase size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Projeler</h3>
                  <p className="text-sm font-bold opacity-40">AKTİF ARAŞTIRMA VEYA YARIŞMA DÜĞÜMLERİNİ TANIMLA</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Düğüm Adı</label>
                    <input 
                        type="text" 
                        value={newProject.name}
                        onChange={e => setNewProject({...newProject, name: e.target.value})}
                        className="w-full border-4 border-black p-4 font-bold text-sm uppercase"
                        placeholder="TEKNOFEST 2024"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Düğüm Kodu</label>
                    <input 
                        type="text" 
                        value={newProject.id}
                        onChange={e => setNewProject({...newProject, id: e.target.value})}
                        className="w-full border-4 border-black p-4 font-bold text-sm uppercase font-mono"
                        placeholder="TK-24"
                    />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-6 font-black uppercase text-xl border-2 border-black hover:bg-emerald-500 transition-colors">
                Düğümü Dağıt
              </button>
            </motion.form>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-black text-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(16,185,129,0.3)]">
            <div className="space-y-8 text-center">
              <div className="w-20 h-20 bg-emerald-500 text-black border-4 border-black mx-auto flex items-center justify-center -rotate-3">
                <Shield size={40} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-2">Güvenlik Durumu</p>
                <h4 className="text-4xl font-black italic tracking-tighter italic">DAİMİ LEDGER</h4>
                <p className="text-[10px] font-bold uppercase mt-4 opacity-60">HER KAYIT BİR BLOKTUR. DEĞİŞTİRİLEMEZ.</p>
              </div>
              <div className="text-left border-t-2 border-white/10 pt-6 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="opacity-40 uppercase">Algoritma</span>
                    <span>SHA-256</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="opacity-40 uppercase">Güvenlik</span>
                    <span>İMMUTABLE</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <h5 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 border-b-2 border-black pb-2">Düğüm Ortamı</h5>
             <div className="space-y-6">
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-black uppercase opacity-60">Mutabakat</span>
                    <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5">POW // SHA-256</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-black uppercase opacity-60">Zorluk</span>
                    <span className="text-[10px] font-mono font-bold bg-yellow-200 px-2 py-0.5 border-2 border-black">DÜŞÜK (GELİŞTİRİCİ)</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-black uppercase opacity-60">Eş Senkronizasyonu</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">BAĞLI</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
