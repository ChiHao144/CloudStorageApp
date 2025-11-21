export default function FileCard({ file }: { file: any }) {
    return (
        <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
            <div style={{fontSize:'2rem', marginBottom:'10px'}}>📄</div>
            <div style={{fontWeight:'bold'}}>{file.name}</div>
            <div style={{color:'#666', fontSize:'0.9rem'}}>{file.size}</div>
        </div>
    );
}