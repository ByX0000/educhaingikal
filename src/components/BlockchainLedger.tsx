import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../lib/firebase';
import { ScholasticBlockchain } from '../lib/blockchain';
import { Block } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Boxes } from 'lucide-react';

export default function BlockchainLedger() {
  const blocksQuery = query(collection(db, 'blocks'), orderBy('index', 'asc'));
  const [blocks, loading] = useCollectionData(blocksQuery);

  const { ascending, descending, validIndices, chainValid, studentCount } = useMemo(() => {
    const asc = (blocks ?? []) as Block[];
    const valid = ScholasticBlockchain.validateBlocks(asc);
    const isValidChain = asc.length > 0 && valid.size === asc.length;
    const studentIds = new Set<string>();
    asc.forEach(b => b.data?.forEach(r => r.studentId && studentIds.add(r.studentId)));
    return {
      ascending: asc,
      descending: [...asc].reverse(),
      validIndices: valid,
      chainValid: isValidChain,
      studentCount: studentIds.size,
    };
  }, [blocks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Boxes size={48} />
        </motion.div>
        <p className="font-black uppercase tracking-widest animate-pulse">Defter Senkronize Ediliyor...</p>
      </div>
    );
  }

  const integrityPercent = ascending.length > 0
    ? Math.round((validIndices.size / ascending.length) * 100)
    : 100;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-8 gap-4">
        <div>
          <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Canlı Defter</h2>
          <p className="font-mono text-sm opacity-60 mt-2">
            GERÇEK ZAMANLI İŞLEM AKIŞI //{' '}
            {chainValid ? 'ZİNCİR ÜZERİNDE DOĞRULANDI' : 'UYARI: ZİNCİRDE TUTARSIZLIK'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="border-4 border-black px-6 py-2 bg-yellow-100 font-black text-xl italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {ascending.length} BLOK
          </div>
        </div>
      </div>

      <div className="border-4 border-black bg-white overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 bg-black text-white text-[10px] font-black uppercase p-4 tracking-widest">
          <div className="col-span-1">Endeks</div>
          <div className="col-span-3">Öğrenci / Yıl</div>
          <div className="col-span-3">Proje / Tür</div>
          <div className="col-span-4">Blok Özeti</div>
          <div className="col-span-1 text-right">Durum</div>
        </div>

        <div className="divide-y-4 divide-black">
          <AnimatePresence mode="popLayout">
            {descending.map((block) => {
              const isValid = validIndices.has(block.index);
              return (
              <motion.div
                key={block.hash}
                initial={{ backgroundColor: '#fff' }}
                animate={{ backgroundColor: '#fff' }}
                whileHover={{ backgroundColor: '#FEF9C3' }}
                className="grid grid-cols-1 md:grid-cols-12 p-4 md:p-6 items-center gap-4 transition-colors"
              >
                <div className="col-span-1 font-mono font-black text-2xl">
                  #{block.index}
                </div>

                <div className="col-span-1 md:col-span-3">
                  {block.data && block.data.length > 0 ? (
                    block.data.map((r, ri: number) => (
                      <div key={ri} className="mb-2 last:mb-0">
                        <div className="font-black text-xl uppercase tracking-tighter leading-tight">
                          {r.studentName}
                        </div>
                        <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                          {r.achievement || 'Katılım'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="font-black text-lg text-emerald-600 uppercase italic">Başlangıç Bloğu</div>
                  )}
                </div>

                <div className="col-span-1 md:col-span-3">
                    {block.data && block.data.length > 0 ? (
                      block.data.map((r, ri: number) => (
                        <div key={ri} className="mb-2 last:mb-0">
                            <div className="font-bold text-gray-900">{r.projectName}</div>
                            <div className="text-[10px] font-mono opacity-50 uppercase">{r.role}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-mono opacity-40 uppercase">Başlangıç Sistem Durumu</div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-4 font-mono text-[10px] opacity-40 break-all bg-gray-50 p-2 border-2 border-dashed border-black/10">
                  {block.hash}
                  <div className="mt-1 flex gap-2">
                    <span className="text-black font-bold">ÖNCEKİ:</span> {block.previousHash.substring(0, 16)}...
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <span className={`inline-block border-2 border-black text-[10px] font-black px-3 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    isValid ? 'bg-emerald-300 text-black' : 'bg-red-500 text-white'
                  }`}>
                    {isValid ? 'Doğrulandı' : 'Geçersiz'}
                  </span>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
          chainValid ? 'bg-emerald-400' : 'bg-red-400'
        }`}>
          <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Ağ Bütünlüğü</div>
          <div className="text-6xl font-black italic tracking-tighter">{integrityPercent}%</div>
          <div className="text-sm font-bold uppercase mt-4">
            {validIndices.size}/{ascending.length} Geçerli Blok
          </div>
        </div>
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Aktif Öğrenciler</div>
          <div className="text-6xl font-black italic tracking-tighter">{studentCount}</div>
          <div className="text-sm font-bold uppercase mt-4">Zincirde Kayıtlı</div>
        </div>
        <div className="bg-black text-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-2">Algoritma</div>
          <div className="text-4xl font-black font-mono">SHA-256</div>
          <div className="text-sm font-bold uppercase mt-4">PoW Zorluk: {ScholasticBlockchain.DIFFICULTY}</div>
        </div>
      </div>
    </div>
  );
}
