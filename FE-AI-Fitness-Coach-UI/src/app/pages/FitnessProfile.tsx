import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";
import { useUser } from "../context/UserContext";
import WebsiteNav from "../components/WebsiteNav";

const goalOptions = [
  "Giam can",
  "Tang co",
  "Cai thien suc ben",
  "Tang tinh linh hoat",
  "The duc tong quat",
];

const isPositiveNumber = (value: string) => Number(value) > 0;

export default function FitnessProfile() {
  const navigate = useNavigate();
  const { setFitnessProfile } = useUser();
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState("");
  const [error, setError] = useState("");

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal],
    );
  };

  const handleNumberChange =
    (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      if (nextValue === "" || Number(nextValue) >= 0) {
        setter(nextValue);
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !isPositiveNumber(age) ||
      !isPositiveNumber(weight) ||
      !isPositiveNumber(height)
    ) {
      setError("Tuoi, can nang va chieu cao phai lon hon 0.");
      return;
    }

    if (!fitnessLevel) {
      setError("Vui long chon muc do the duc.");
      return;
    }

    if (goals.length === 0) {
      setError("Vui long chon it nhat mot muc tieu.");
      return;
    }

    setFitnessProfile({
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      fitnessLevel,
      goals,
      restrictions,
    });
    navigate("/plan-generation");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <WebsiteNav />

      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
        />

        <Card className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl border-gray-800 relative z-10">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Ho so the duc cua ban</CardTitle>
            <CardDescription className="text-gray-400">
              Giup AI hieu the trang hien tai va muc tieu cua ban.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-200">
                    Tuoi
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min={13}
                    max={100}
                    inputMode="numeric"
                    placeholder="25"
                    value={age}
                    onChange={handleNumberChange(setAge)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-gray-200">
                    Can nang (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min={25}
                    max={300}
                    step="0.1"
                    inputMode="decimal"
                    placeholder="70"
                    value={weight}
                    onChange={handleNumberChange(setWeight)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-gray-200">
                    Chieu cao (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min={100}
                    max={250}
                    inputMode="numeric"
                    placeholder="175"
                    value={height}
                    onChange={handleNumberChange(setHeight)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitness-level" className="text-gray-200">
                  Muc do the duc hien tai
                </Label>
                <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                  <SelectTrigger
                    id="fitness-level"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  >
                    <SelectValue placeholder="Chon muc do the duc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Moi bat dau</SelectItem>
                    <SelectItem value="intermediate">
                      Trung cap - Tap luyen thuong xuyen
                    </SelectItem>
                    <SelectItem value="advanced">
                      Nang cao - Co kinh nghiem tap luyen
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-200">
                  Muc tieu the duc (chon tat ca muc phu hop)
                </Label>
                {goalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={goals.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                      className="border-gray-600"
                    />
                    <Label
                      htmlFor={goal}
                      className="font-normal cursor-pointer text-gray-300"
                    >
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictions" className="text-gray-200">
                  Han che an uong hoac chan thuong (tuy chon)
                </Label>
                <Textarea
                  id="restrictions"
                  placeholder="Vi du: an chay, chan thuong dau goi, di ung dau..."
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500"
                size="lg"
                disabled={goals.length === 0}
              >
                Tao ke hoach AI cua toi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>&copy; 2026 FitAI. Tat ca quyen duoc bao luu.</p>
        </div>
      </footer>
    </div>
  );
}
