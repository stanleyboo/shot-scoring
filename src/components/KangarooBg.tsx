const kangaroos = [
  { top: '3%', left: '5%', size: 180, rotate: 15 },
  { top: '12%', left: '75%', size: 120, rotate: -10 },
  { top: '28%', left: '88%', size: 200, rotate: 5 },
  { top: '45%', left: '2%', size: 150, rotate: -20 },
  { top: '55%', left: '60%', size: 250, rotate: 12 },
  { top: '70%', left: '30%', size: 100, rotate: -8 },
  { top: '80%', left: '85%', size: 160, rotate: 18 },
  { top: '15%', left: '40%', size: 90, rotate: -15 },
  { top: '90%', left: '15%', size: 220, rotate: 8 },
  { top: '38%', left: '50%', size: 130, rotate: -25 },
  { top: '65%', left: '10%', size: 170, rotate: 20 },
  { top: '5%', left: '55%', size: 110, rotate: -5 },
];

export default function KangarooBg() {
  return (
    <div className="kangaroo-bg" aria-hidden="true">
      {kangaroos.map((k, i) => (
        <img
          key={i}
          src="/kangaroo-v2.png"
          alt=""
          className="k"
          style={{
            top: k.top,
            left: k.left,
            width: k.size,
            height: 'auto',
            transform: `rotate(${k.rotate}deg)`,
            opacity: 0.15,
          }}
        />
      ))}
    </div>
  );
}
